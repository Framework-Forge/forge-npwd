local resourceName = GetCurrentResourceName()
local config = json.decode(LoadResourceFile(resourceName, "config.json") or "{}") or {}
local deviceConfig = config.device or {}
local itemName = deviceConfig.itemName or "phone"
local recentUses = {}

print(("[Forge NPWD] Device bridge loaded for item '%s'."):format(itemName))

local function itemMetadata(item)
    if type(item) ~= "table" then return {} end
    return item.metadata or item.info or {}
end

exports("setForgeNPWDMetadata", function(source, slot, metadata)
    if not pr_lib or not pr_lib.inventory or not pr_lib.inventory.SetMetadata then return false end
    if type(source) ~= "number" or slot == nil or type(metadata) ~= "table" then return false end

    local current = pr_lib.inventory.GetItemBySlot and pr_lib.inventory.GetItemBySlot(source, slot)
    if type(current) ~= "table" or (current.name or current.item) ~= itemName then return false end

    return pr_lib.inventory.SetMetadata(source, slot, metadata) ~= false
end)

exports("addForgeNPWDItem", function(source, metadata, slot)
    if not pr_lib or not pr_lib.inventory or not pr_lib.inventory.AddItem then
        return { success = false, error = "INVENTORY_BRIDGE_UNAVAILABLE" }
    end
    source = tonumber(source)
    slot = tonumber(slot)
    if not source or type(metadata) ~= "table" then
        return { success = false, error = "INVALID_INVENTORY_PAYLOAD" }
    end
    if pr_lib.inventory.CanCarryItem and not pr_lib.inventory.CanCarryItem(source, itemName, 1, metadata) then
        return { success = false, error = "INVENTORY_FULL" }
    end
    local success, response = pr_lib.inventory.AddItem(source, itemName, 1, metadata, slot)
    if not success then
        return { success = false, error = type(response) == "string" and response or "INVENTORY_ADD_FAILED" }
    end
    return { success = true }
end)

exports("removeForgeNPWDItem", function(source, metadata)
    if not pr_lib or not pr_lib.inventory or not pr_lib.inventory.RemoveItem then return false end
    source = tonumber(source)
    if not source or type(metadata) ~= "table" then return false end
    return pr_lib.inventory.RemoveItem(source, itemName, 1, metadata) ~= false
end)

local function dispatchPhoneUse(source, item)
    local slot = type(item) == "table" and tonumber(item.slot) or nil
    source = tonumber(source)
    if not source or not slot then
        print(("[Forge NPWD] Rejected phone use with invalid source/slot: source=%s slot=%s"):format(
            tostring(source), tostring(slot)
        ))
        return false
    end

    local key = ("%s:%s"):format(source, slot)
    if recentUses[key] then return false end
    recentUses[key] = true
    SetTimeout(750, function() recentUses[key] = nil end)

    print(("[Forge NPWD] Phone use received: source=%s slot=%s"):format(source, slot))
    TriggerEvent("forge-npwd:server:useDevice", source, {
        name = item.name or item.item or itemName,
        slot = slot,
        metadata = itemMetadata(item),
    })

    return true
end

local function usePhoneSlot(playerSource, slot)
    playerSource = tonumber(playerSource)
    slot = tonumber(slot)
    local current = playerSource and slot and pr_lib and pr_lib.inventory and pr_lib.inventory.GetItemBySlot
        and pr_lib.inventory.GetItemBySlot(playerSource, slot) or nil

    if type(current) ~= "table" or (current.name or current.item) ~= itemName then
        print(("[Forge NPWD] Rejected phone slot: source=%s slot=%s item=%s"):format(
            tostring(playerSource), tostring(slot), tostring(current and (current.name or current.item))
        ))
        return false
    end

    return dispatchPhoneUse(playerSource, current)
end

exports("usePhoneSlot", usePhoneSlot)
