-- SPDX-License-Identifier: GPL-3.0-or-later
-- Qbox qbx_npwd player integration, adapted for Forge NPWD / PR Bridge.
local resource = GetCurrentResourceName()
local config = json.decode(LoadResourceFile(resource, 'config.json') or '{}') or {}
local itemName = (config.device or {}).itemName or 'phone'
local loaded, revisions, pending = {}, {}, {}
local registration = 0

RegisterNetEvent('forge-npwd:server:usePhoneItem', function(slot)
    local src = tonumber(source) -- Never accept a player id or metadata from the client.
    slot = tonumber(slot)
    if not src or not slot or slot < 1 or slot % 1 ~= 0 then return end
    exports[resource]:usePhoneSlot(src, slot)
end)

local function unload(src)
    src = tonumber(src)
    if not src then return end
    revisions[src] = (revisions[src] or 0) + 1
    pending[src] = nil
    loaded[src] = nil
    exports[resource]:unloadPlayer(src)
end

local function loadPlayer(src)
    src = tonumber(src)
    if not src or GetResourceState(resource) ~= 'started' then return end
    local profile = pr_lib.framework.GetPhoneProfile(src)
    if not profile or loaded[src] == profile.identifier or pending[src] == profile.identifier then return end
    if loaded[src] or pending[src] then unload(src) end
    local revision = revisions[src] or 0
    pending[src] = profile.identifier
    local function isCurrent()
        if (revisions[src] or 0) ~= revision then return false end
        local current = pr_lib.framework.GetPhoneProfile(src)
        return current ~= nil and current.identifier == profile.identifier
    end
    -- Optional completion callback avoids marking a failed/asynchronous load ready.
    exports[resource]:newPlayer(profile, function(success)
        if (revisions[src] or 0) ~= revision then return end
        pending[src] = nil
        if success and isCurrent() then loaded[src] = profile.identifier end
    end, isCurrent)
end

local function registerPhoneItem()
    registration = registration + 1
    local generation = registration
    local ok, result = pcall(pr_lib.inventory.RegisterUsableItem, itemName, function(src, item)
        if generation ~= registration then return end
        local slot = type(item) == 'table' and tonumber(item.slot) or nil
        if slot then exports[resource]:usePhoneSlot(tonumber(src), slot) end
    end, { cancelUse = true })
    if not ok or result == false then
        print('[Forge NPWD] The PR Bridge inventory adapter could not register the phone item; configure its client usePhoneItem export.')
    end
end

local function restorePlayers()
    for key, value in pairs(pr_lib.framework.GetAllPlayers() or {}) do
        local src = type(value) == 'table' and (value.source or (value.PlayerData or {}).source)
            or tonumber(value)
        loadPlayer(src or tonumber(key))
    end
end
AddEventHandler('pr_bridge:server:OnPlayerLoaded', loadPlayer)
AddEventHandler('pr_bridge:server:OnPlayerUnloaded', unload)
AddEventHandler('playerDropped', function() unload(source) end)
AddEventHandler('onResourceStart', function(name)
    if name == resource then
        pr_lib.database.ready(function() registerPhoneItem(); restorePlayers() end)
    elseif name == 'ox_inventory' or name == 'pr_bridge' then
        registerPhoneItem()
        restorePlayers()
    end
end)
