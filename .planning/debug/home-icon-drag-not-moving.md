---
status: resolved
trigger: "Long press enters home edit mode and shows empty slots, but the application icon does not follow the pointer and cannot be repositioned within or between home pages."
created: 2026-09-30
updated: 2026-09-30
---

# Home icon drag not moving

## Symptoms

- Expected: holding an icon enters edit mode and the same continuous gesture drags it to another slot or page.
- Actual: icons blink and empty slot outlines appear, but the selected icon remains fixed and cannot be dropped.
- Errors: no client or server error reported.
- Timeline: present in the first native FiveM test of the Phase 2 home screen.
- Reproduction: open a provisioned phone, hold an app icon until edit mode appears, then move toward an empty slot.

## Current Focus

- hypothesis: Confirmed from the event lifecycle. Native HTML drag cannot start because `draggable` changes from false to true after the pointer-down gesture has already begun.
- test: Native FiveM UAT after replacing HTML drag/drop with pointer capture and coordinate-based slot detection.
- expecting: The icon follows the pointer immediately after the hold threshold, highlights the target slot and persists after release.
- next_action: restart forge-phone and validate same-page and cross-page movement in FiveM
- reasoning_checkpoint: Page creation and per-device persistence are already validated, isolating the failure to the UI gesture layer.

## Evidence

- timestamp: 2026-09-30
  observation: Edit mode activates and empty slot markers render.
  implication: Long-press timing and home layout rendering work; failure occurs after edit activation.
- timestamp: 2026-09-30
  observation: The current icon element is `draggable={editing}`, while editing becomes true only inside a 500 ms timer started by pointer-down.
  implication: The browser evaluated the initial pointer gesture while the element was not draggable, so the same gesture cannot produce native drag events.

## Eliminated

- hypothesis: Page count or per-device layout persistence is broken.
  evidence: User confirmed three pages on one device and five on another, with correct separation.

## Resolution

- root_cause: The original implementation depended on `dragstart`, but the element only became draggable after the long-press timer. The active pointer gesture therefore never became a native browser drag operation in FiveM NUI.
- fix: Replaced native drag events with pointer capture. The active icon now renders as a floating preview under the pointer, resolves slots with `elementFromPoint`, highlights its destination, swaps or moves on release, and changes pages through enlarged page indicators.
- verification: Production NUI build completed successfully and the user confirmed native FiveM dragging, same-device layout changes and per-device page separation work correctly.
- files_changed: `apps/phone/src/apps/home/components/Home.tsx`.
