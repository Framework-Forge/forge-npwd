---
status: resolved
trigger: "Using newly created phone items raises: No such export setPhoneDisabled in resource npwd; only barcode metadata appears and Forge Phone tables stay empty."
created: 2026-09-29
updated: 2026-09-29
---

# Phone provisioning not running

## Symptoms

- Expected: using a new `phone` item calls Forge Phone, writes `metadata.forgePhone`, inserts profile, line and device rows, then opens the phone.
- Actual: inventory shows only its generated barcode; no rows are written; the item fails with `No such export setPhoneDisabled in resource npwd`.
- Error: `@ox_inventory/modules/items/client.lua:344: No such export setPhoneDisabled in resource npwd`.
- Timeline: first live test after introducing the separate `forge-phone` resource.
- Reproduction: create a dynamic phone item whose client JSON references `npwd.setPhoneDisabled`, add it to inventory and use it.

## Current Focus

- hypothesis: Confirmed. The phone's `client` table contains add/remove hooks, so ox_inventory enters its client-action branch; without `client.export` or `client.event`, that branch returns without executing normal use or server hooks.
- test: Route phone usage through the allowed `forge_npwd` compatibility bridge without changing ox_inventory or forge-core.
- expecting: The bridge receives the use action and forwards a validated live slot to Forge Phone provisioning.
- next_action: restart forge-phone and forge_npwd, confirm binding/use logs, then inspect metadata and database rows
- reasoning_checkpoint: After restart the persisted client export is correct, but no use log or database write occurs. Therefore the fault is before the provisioning service, specifically dispatch of item use.

## Evidence

- timestamp: 2026-09-29
  observation: The item editor contains `clientExport: npwd.setPhoneDisabled` for add/remove actions.
  implication: The inventory is configured to call a client export on a resource that is no longer started under that name.
- timestamp: 2026-09-29
  observation: All three Forge Phone tables remain empty and the item has only a barcode.
  implication: The server-side provisioning event has not completed.
- timestamp: 2026-09-29
  observation: `server.cfg` started `forge_npwd` and Forge apps but did not start `forge-phone`; the old `npwd` resource was commented out.
  implication: Neither the requested old export nor the new device service was available to complete provisioning.
- timestamp: 2026-09-29
  observation: `forge_npwd` hardcoded exports from `npwd` and registered the phone as usable, opening the UI directly.
  implication: Even if the new resource were started manually, the wrapper could bypass device creation.
- timestamp: 2026-09-29
  observation: `general.useResourceIntegration` was false and `dist/html` had not been built.
  implication: The bridge session exports and the NUI required by the new standalone resource were unavailable.
- timestamp: 2026-09-29
  observation: Standalone configuration targeted `users.identifier`, while this server and `forge_npwd` use `players.citizenid`.
  implication: Legacy-number compatibility would fail after provisioning and prevent the phone from opening.
- timestamp: 2026-09-29
  observation: After the first fix and restart, `data/items.json` contains `forge-phone.setPhoneDisabled`, yet clicking Use produces no client/server log and no database row.
  implication: Client export migration succeeded; the remaining failure occurs before `DeviceService.usePhoneItem`, in the indirect usable-item dispatch.
- timestamp: 2026-09-29
  observation: ox_inventory `useSlot` enters `elseif data.client` for the phone because add/remove hooks create that table, but only executes an action when `data.export` or `data.client.event` exists.
  implication: The phone's use click is deterministically swallowed on the client; no server hook can run.
- timestamp: 2026-09-29
  observation: The static ox_inventory loader converts `client.export` into `data.export`, but the custom runtime `setForgeItem` loader did not perform that conversion.
  implication: Merely persisting `forge-phone.usePhoneItem` would still not execute for dynamically synchronized Forge items; the runtime loader also requires parity with startup loading.

## Eliminated

## Resolution

- root_cause: Mixed old/new resource wiring was fixed, but the dynamic phone's add/remove client hooks caused ox_inventory to choose an otherwise empty client-use branch, swallowing every Use action before it reached the server.
- fix: `forge_npwd` applies the phone-use event locally whenever its client loads, forwards the selected slot to the validated `forge-phone.usePhoneSlot` export, and relies on its existing inventory polling for add/remove state. No ox_inventory or forge-core source file is modified.
- verification: Live FiveM test confirmed two unique phone items, two device rows, two line rows and two profile rows. Both items provisioned independently and the phone opened through the bridge. Scope audit confirms no phone-use modification remains in ox_inventory or forge-core source.
- files_changed: `server.cfg`; `forge_npwd/fxmanifest.lua`; `forge_npwd/client.lua`; `forge_npwd/server.lua`; `forge-phone/fxmanifest.lua`; `forge-phone/config.json`; `forge-phone/apps/game/client/device_bridge.lua`; `forge-phone/apps/game/server/device_bridge.lua`; `forge-phone/apps/game/server/photo/photo.service.ts`; `forge-phone/apps/game/server/devices/device.service.ts`.
