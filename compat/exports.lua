-- FiveM resolves exports through these local events in both Lua and JS.
-- Register aliases inside the phone, without extra resources or network events.
local resource = GetCurrentResourceName()
local aliases = json.decode(LoadResourceFile(resource, 'compat/aliases.json') or '{}') or {}
local catalog = json.decode(LoadResourceFile(resource, 'compat/exports.json') or '{}') or {}
local side = IsDuplicityVersion() and 'server' or 'client'

for legacy, canonical in pairs(aliases.resources or {}) do
    local methods = catalog[canonical] and catalog[canonical][side] or {}
    local registered = {}
    local function register(alias, method)
        if registered[alias] then return end
        registered[alias] = true
        AddEventHandler(('__cfx_export_%s_%s'):format(legacy, alias), function(setCallback)
            setCallback(function(...)
                if GetResourceState(canonical) ~= 'started' then
                    error(('Forge NPWD compatibility: provider %s is not started'):format(canonical))
                end
                local api = exports[canonical]
                -- Lua's export proxy consumes self; the original arguments stay intact.
                return api[method](api, ...)
            end)
        end)
    end
    for _, method in ipairs(methods) do
        register(method, method)
        for oldMethod, currentMethod in pairs(aliases.exports or {}) do
            if currentMethod == method then register(oldMethod, method) end
        end
    end
end
