local resourceName = GetCurrentResourceName()
local config = json.decode(LoadResourceFile(resourceName, "config.json") or "{}") or {}
local deviceConfig = config.device or {}
local itemName = deviceConfig.itemName or "phone"

print(("[Forge NPWD] Client device bridge loaded for item '%s'."):format(itemName))

exports("hasForgeNPWDItem", function()
    if not pr_lib or not pr_lib.inventory or not pr_lib.inventory.HasItem then return false end
    return pr_lib.inventory.HasItem(itemName, 1) == true
end)
