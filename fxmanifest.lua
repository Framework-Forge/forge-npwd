fx_version("cerulean")
game("gta5")
description("Forge NPWD - persistent multi-device phone for Forge-Core")
authors({ "itschip", "erik-sn", "TasoOneAsia", "kidz", "RockySouthpaw", "SamShanks", "c-wide", "mojito" })
version("3.15.1-beta.2")
client_scripts({
	"@pr_bridge/init.lua",
	"compat/exports.lua",
	"compat/app.lua",
	"compat/controls.lua",
	"apps/game/client/device_bridge.lua",
	"dist/game/client/client.js",
	"dist/game/client/*.lua",
	"apps/game/client/player_bridge.lua",
})

server_script({
	"@pr_bridge/init.lua",
	"compat/exports.lua",
	"compat/app.lua",
	"apps/game/server/device_bridge.lua",
	-- This is a file that lives purely in source code and isn't compiled alongside
	-- rest of the release. It's used to detect whether a user can read or not.
	"dist/game/server/server.js",
	"apps/game/server/player_bridge.lua",
})

ui_page("dist/html/index.html")

files({
	"config.json",
	"dist/html/index.html",
	"dist/html/**/*",
	"compat/*.lua",
	"compat/exports.json",
	"compat/aliases.json",
})

dependency({
	"pr_bridge",
	"screenshot-basic",
	"pma-voice",
})

-- Dependency replacement; export forwarding lives in compat/exports.lua.
provide("npwd")
provide("forge-phone")
provide("forge_npwd")
provide("qbx_npwd")
provide("forge-npwd-bridge")
