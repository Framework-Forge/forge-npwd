-- Per-app compatibility. Loaded after PR Bridge and before the application's scripts.
-- No phone/session logic lives here: old requests use the same canonical handlers.
local provider = 'forge-npwd'
local aliases = json.decode(LoadResourceFile(provider, 'compat/aliases.json'))
local resources = aliases.resources

local function canonical(name)
    if type(name) ~= 'string' then return name end
    if resources[name] then return resources[name] end
    local app, rest = name:match('^npwd:forge[-_]([%a]+)(:.*)$')
    if app then return 'forge-npwd:' .. app .. rest end
    for old, current in pairs(resources) do
        if name:sub(1, #old + 1) == old .. ':' then return current .. name:sub(#old + 1) end
    end
    return name
end
local function legacyNames(name)
    local list, seen = {}, {}
    local function add(value)
        if value ~= name and not seen[value] then list[#list + 1] = value; seen[value] = true end
    end
    for old, current in pairs(resources) do
        if name:sub(1, #current + 1) == current .. ':' then add(old .. name:sub(#current + 1)) end
    end
    local app, rest = name:match('^forge%-npwd:([%a]+)(:.*)$')
    if not ({mail=true,management=true,weather=true,garage=true,housing=true})[app] then app=nil end
    if app then add('npwd:forge_' .. app .. rest); add('npwd:forge-' .. app .. rest) end
    return list
end

local registerNet, addHandler = RegisterNetEvent, AddEventHandler
local registeringNetwork = false
RegisterNetEvent = function(name, handler)
    if type(handler) ~= 'function' then
        local result = registerNet(name)
        for _, legacy in ipairs(legacyNames(name)) do registerNet(legacy) end
        return result
    end
    registeringNetwork = true
    local result = registerNet(name, handler)
    for _, legacy in ipairs(legacyNames(name)) do registerNet(legacy, handler) end
    registeringNetwork = false
    return result
end
AddEventHandler = function(name, handler)
    local result = addHandler(name, handler)
    if not registeringNetwork then
        for _, legacy in ipairs(legacyNames(name)) do addHandler(legacy, handler) end
    end
    return result
end

if IsDuplicityVersion() then
    if pr_lib and pr_lib.callback and pr_lib.callback.register then
        local register = pr_lib.callback.register
        pr_lib.callback.register = function(name, handler)
            register(name, handler)
            for _, legacy in ipairs(legacyNames(name)) do register(legacy, handler) end
        end
    end
else
    local register = RegisterNUICallback
    local callbacks = {}
    RegisterNUICallback = function(name, handler)
        callbacks[name] = handler
        register(name, handler)
        for _, legacy in ipairs(legacyNames(name)) do register(legacy, handler) end
    end
    exports('compatGetNuiCallbacks', function()
        local names = {}
        for name in pairs(callbacks) do names[#names + 1] = name end
        return names
    end)
    exports('compatInvokeNui', function(name, data, response)
        local handler = callbacks[canonical(name)]
        if not handler then response({status='error',error='unknown_callback'}); return end
        CreateThread(function()
            local completed = false
            local function answer(value)
                if completed then return end
                completed = true
                response(value or {})
            end
            local ok = pcall(handler, data, answer)
            if not ok then answer({status='error',error='callback_failed'}) end
        end)
    end)
end
