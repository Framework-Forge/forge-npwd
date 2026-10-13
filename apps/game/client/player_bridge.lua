-- SPDX-License-Identifier: GPL-3.0-or-later
-- Qbox qbx_npwd player integration, adapted for Forge NPWD / PR Bridge.
-- Framework and inventory adapters are owned by PR Bridge, not another resource.
local resource = GetCurrentResourceName()
local config = json.decode(LoadResourceFile(resource, 'config.json') or '{}') or {}
local itemName = (config.device or {}).itemName or 'phone'
local hasPhone = false

local function checkPhone(unloaded)
    local available = not unloaded and pr_lib.framework.IsPlayerLoaded()
        and (tonumber(pr_lib.inventory.GetItemCount(itemName)) or 0) > 0 or false
    if not (config.PhoneAsItem or {}).enabled then available = not unloaded and pr_lib.framework.IsPlayerLoaded() end
    hasPhone = available
    if GetResourceState(resource) == 'started' then exports[resource]:setPhoneDisabled(not available) end
end
exports('HasPhone', function() return hasPhone end)

local function usePhoneItem(data, item)
    local used = type(item) == 'table' and item or data
    local slot = type(used) == 'table' and tonumber(used.slot) or nil
    if not slot or slot < 1 or slot % 1 ~= 0 then return false end
    TriggerServerEvent('forge-npwd:server:usePhoneItem', slot)
    return true
end
exports('usePhoneItem', usePhoneItem)
RegisterNetEvent('forge-npwd:client:usePhoneItem', usePhoneItem)
RegisterNetEvent('forge-npwd:client:setPhoneVisible', function(visible)
    checkPhone()
    if hasPhone then exports[resource]:setPhoneVisible(visible == true) end
end)

local function bindPhoneItem()
    -- Optional convenience for Forge's dynamic ox items. Other inventories use
    -- PR Bridge's server usable-item adapter, or the client usePhoneItem export.
    if GetResourceState('ox_inventory') == 'started' then
        TriggerEvent('ox_inventory:forge:setItem', itemName, {
            name = itemName, client = { event = 'forge-npwd:client:usePhoneItem' }
        }, true)
    end
end
AddEventHandler('pr_bridge:client:OnPlayerLoaded', function() checkPhone() end)
AddEventHandler('pr_bridge:client:OnPlayerUnloaded', function() checkPhone(true) end)
AddEventHandler('pr_bridge:client:OnInventoryChanged', function() checkPhone() end)
AddEventHandler('onClientResourceStart', function(name)
    if name == resource or name == 'ox_inventory' then SetTimeout(500, bindPhoneItem) end
end)
CreateThread(function()
    Wait(500)
    bindPhoneItem()
    while true do checkPhone(); Wait(1500) end
end)
