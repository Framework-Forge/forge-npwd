---
phase: "2"
slug: "area-de-trabalho-real"
status: approved
shadcn_initialized: false
preset: none
created: "2026-09-29"
---

# Phase 2 — UI Design Contract

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | Material UI 5 plus existing NPWD components |
| Icon library | Existing dynamic NPWD icon sets and Lucide React |
| Font | Existing phone theme font; app labels use 11px/500 |

No new visual library is introduced. Existing application icons, wallpaper, phone frame, notification badges and bottom navigation remain authoritative.

## Interaction Contract

- The home has 1 to 5 pages. A new profile starts with exactly 1 page.
- Every page uses the same fixed wallpaper. Only the icon layer moves horizontally.
- The grid is 4 columns by 5 rows, totaling 20 stable slots per page. Empty slots are first-class positions.
- Every enabled application appears exactly once across all pages. Newly installed or newly available apps fill the first free slot.
- Horizontal pointer/touch movement outside edit mode changes pages. The transition snaps to one page and never stops between pages.
- Holding an icon for 500ms enters edit mode. Icons receive a subtle scale/wiggle treatment and empty drop targets become visible.
- While editing, dragging an icon onto an occupied slot swaps the two positions. Dragging onto an empty slot moves it there.
- Dragging near a left/right screen edge for 450ms changes the destination page while retaining the dragged icon.
- A short tap opens an app only outside edit mode. Tapping an empty area exits edit mode.
- The current page is communicated with compact dots above the existing bottom navigation.
- Page count is changed under Settings > Appearance > Home pages. Reducing the count compacts displaced apps into earlier free slots before saving and never deletes an app.
- All changes persist against the active `profile_id`; different devices/profiles retain independent layouts.

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Badge and drag-target inset |
| sm | 8px | Page padding and label gap |
| md | 16px | Settings rows and page indicator area |
| lg | 24px | Top safe area below status bar |

Exceptions: each grid cell is 25% width and one fifth of the available launcher height; icon artwork remains the existing 64px size.

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| App label | 11px | 500 | 1.15 |
| Page setting value | 14px | 400 | 1.4 |
| Settings section | existing | existing | existing |

App labels are single-line, centered and ellipsized. Localized names remain accessible through `aria-label` and tooltip behavior.

## Color

The wallpaper and current theme remain dominant. No new brand palette is introduced. Empty drop targets use the current text color at 18% opacity; selected page dots use current text color at 90%, inactive dots at 35%. Destructive color is not used in this phase.

## Copywriting Contract

| Element | Copy |
|---------|------|
| Settings row | Páginas da tela inicial |
| Settings description | Escolha entre 1 e 5 páginas para organizar seus aplicativos. |
| Save error | Não foi possível salvar a organização. Tente novamente. |
| Load error | Não foi possível carregar sua organização. A disposição padrão foi aplicada. |

## Responsive and State Contract

- Loading: render no duplicate launcher; show the default normalized layout only after the fetch resolves or fails.
- Empty page: wallpaper remains visible with empty slots available in edit mode.
- One page: page dots are hidden and horizontal paging is disabled.
- Five pages: dots remain centered and fit without horizontal scrolling.
- Overflow: enabled apps beyond available slots are appended only after increasing pages; because 100 slots exceed the supported app count, no app may silently disappear.
- Stale layout: unknown app IDs are discarded, duplicate IDs are deduplicated, and missing enabled apps are appended to free slots.
- Save failure: restore the last server-confirmed layout and show the documented error.

## Accessibility and Input

- Pointer events support mouse input in FiveM NUI and touch semantics in browser previews.
- Dragging suppresses navigation and click activation.
- Every occupied slot is keyboard-focusable; Enter opens normally and Escape exits edit mode.
- Reduced-motion preference disables wiggle and shortens snap animation to effectively immediate.

## UI Considerations

Applicable state considerations resolved: 8 covered, 0 backstop, 0 unresolved.

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| loading | launcher | covered | Layout is normalized only after fetch settles. |
| empty | page | covered | Empty page preserves wallpaper and edit targets. |
| zero-one-many | page indicator | covered | Hidden for one page; one dot per page otherwise. |
| overflow | app registry | covered | Missing apps append; apps never silently disappear. |
| partial | stale persisted layout | covered | Unknown and duplicate IDs are normalized. |
| error | load and save | covered | Documented fallback, rollback and user message. |
| long-text | app labels | covered | One-line ellipsis plus accessible full label. |
| motion | drag and swipe | covered | Snap, drag suppression and reduced-motion behavior are fixed. |

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS
- [x] Dimension 7 Inventory Provenance: PASS (Tool is none; established project components enumerated in source inspection)

**Approval:** approved 2026-09-29
