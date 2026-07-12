# PrintFlow — Changelist

---

## Session 13 — 14 June 2026  (background-aware 3D palette + enter/exit transition)

### §14 Background-adaptive colour scheme (`inspector3d.js`)
- Added per-background palettes: on a **black** background cards use brighter colours with white edges and a higher glow; on **white / whitish-grey** they switch to deeper, saturated colours with dark edges and almost no glow. The page plate colour is tuned per background (light plate on black, white plate on grey, light-grey plate on white). Changing the background now rebuilds the scene and the footer legend swatches recolour to match.

### §15 Enter/exit transition (`inspector3d.js`, `style.css`)
- The 3D view now fades in with a zoom (scale 0.92→1) over **0.42s** with a gentle overshoot "pop" (so it's noticeable but not sluggish), and fades out with a zoom-back over **0.3s** on close. Teardown is deferred until the exit animation finishes; resources are captured per-session and element ids are freed immediately so a rapid re-open can't collide with the closing view. The double-click-to-edit delay was bumped to 260ms so the context menu lands after the exit.

---

## Session 12 — 14 June 2026  (grip bars: QR/barcode/image + slimmer everywhere)

### Grip "holder" bars (`canvas-elements.js`)
- Added a drag grip bar to **image groups**, which automatically covers **QR codes, barcodes, and brandkit logos** (all are imageBox internally). It's built inside `addSvgResizeHandles`, so it repositions live during resize and is restored on undo/import.
- **Slimmed every grip** (table, shape, text, image) via shared constants `GRIP_H = 2.5mm` (was 4), `GRIP_DOT_R = 0.45`, `GRIP_W_MAX = 18` — applied uniformly across textbox, tablebox, imagebox, barcode, QR, shapes and brandkit elements.

---

## Session 11 — 14 June 2026  (3D view polish batch, QR title, text grip, sync)

### §12 3D view (`inspector3d.js`, `style.css`)
- **Pt1:** uniform card thickness (table cells now match all others) and the layer gap increased 4mm → **8mm**.
- **Pt2:** the WebGL canvas is now full-bleed; the info panel floats over the right edge and is hidden until you pick an element, so the scene renders centred.
- **Pt3:** the on-select action buttons (Locate / Bring-to-front / Send-to-back) now use the circular overlay-button theme.
- **Pt4:** white / whitish-grey / black **background selector** as small round overlay swatches (persisted in `inspector3dBg`).
- **Pt5:** live **zoom %** shown at the right of the footer legend; updates on zoom/scroll/reset.
- **Pt6:** X and Y axes now extend well past the page (like Z) in 3D-Space mode.
- **Pt10:** confirmed the mode button shows the cube icon when axes are on and the layer icon otherwise (default layers).

### Other
- **Pt7 (`canvas-interactions.js`):** context menu now titles QR/barcode image groups as “QR Code”/“Barcode” (and the remove label) instead of “Image Box”.
- **Pt9 (`workspace.html`):** the Add-Shape dropdown shows only the shapes icon (no “Shape” text/caret).
- **Pt11 (`workspace.html`):** Restore-Workspace button recoloured from yellow to blue to match the App Downloads section.
- **Pt12 (`canvas-elements.js`, `scripts.js`):** text blocks now get a draggable grip “holder” bar (like tables/shapes); re-synced after edits and on undo/import via `reattachInteractions`.

### Pt8 — deferred (needs its own pass)
- Adding Shapes / QR / Barcode / Brandkit to the **Create-Own-Template** builder was intentionally not shipped this round: the template builder saves *semantic* elements while the gallery loader (`loadSelectedTemplateFile`) expects unified **DOM-JSON** (`jsonToDom`), so the two formats don't currently line up. Extending it safely means first reconciling that pipeline. Flagged for a dedicated follow-up (variables also pending, per request).

---

## Session 10 — 13 June 2026  (3D layer model, button theme, sleek selection, menu hints)

### §12 3D view — cleaner layer model (`inspector3d.js`)
- **Point 1:** the scene walk was rewritten. Each top-level element now renders as **one card** (the previous walk double-boxed every element's inner primitive). A **table renders as a single layer** — all its cells are drawn coplanar at the table's z (cells tile, so no z-fighting now that cards are opaque); the container box is omitted. Double-click on a cell still opens the table's context menu.
- **Point 2:** the "3D Space" and "Hide Layers" buttons are now icon-only circular buttons matching Undo/Redo (removed the pill labels/inline styles). The mode button swaps its icon (layer-group ↔ cube) and tooltip.

### Shapes/Images — sleek selection (`style.css`, `canvas-elements.js`)
- **Point 3:** shape & image groups have `tabindex`, so right-clicking them drew the browser's thick focus ring. Added `outline:none` for `.svg-shape-group`/`.svg-image-group`; the only cue now is a slim dashed bounding border (`vector-effect:non-scaling-stroke`, ~0.75px at any zoom).

### Side menus — scroll affordance (`style.css`, `scripts.js`)
- **Point 4:** added a thin "more below" chevron (`.menu-scroll-hint`) pinned to the bottom of each side menu; it fades out when the menu is fully scrolled or has nothing to scroll. Injected and managed by `_initMenuScrollHints()`.

### Cross-check (point 5)
- `node --check` passes on all JS; all 65 inline HTML handlers resolve to defined functions; no real duplicate element IDs (the one match is a commented-out line); style.css braces balanced.

---

## Session 9 — 13 June 2026  (beautify alerts/modals; blue=info, yellow=warning)

### Toasts (`scripts.js`, `style.css`)
- `showToast` rewritten with a per-type leading icon and a corrected colour map: **info = blue**, **warning = yellow** (was cyan/info before), success = blue (app theme), danger = red. All 15 info + 37 warning call sites route through this one function, so the change is global.
- Toast restyled: auto height (no more clipping of long messages), 360px width, rounded, drop shadow, left accent bar, icon + text flex layout, soft slide-in animation. Close icon stays dark on the yellow warning toast for contrast.

### Confirm / alert modals (`scripts.js`, `workspace.html`, `style.css`)
- `showConfirmModal(title, message, onConfirm, type="warning")` is now type-aware: blue header for `info`, yellow for `warning`, red for `danger`, each with a matching title icon and OK-button colour. "Restore Draft" now uses `info`; restore/overwrite confirms stay `warning`.
- Reset Canvas modal switched to the yellow warning header + warning icon, Reset button → danger.
- General modal polish: rounded `modal-content`, gradient headers, softer footers, pop-in animation (applies to every modal in the app).

---

## Session 8 — 13 June 2026  (3D view polish: opaque cards, axes mode, toolbar; help)

### §12 3D Layers — visual + interaction upgrades (`inspector3d.js`, `workspace.html`)
- **Opaque cards (point 1):** element meshes are now fully opaque with a subtle emissive lift; only chrome ghosts stay translucent. Base plate bumped to near-opaque so cards read clearly on top.
- **3D Space mode (points 2 & 3):** new toggleable mode adds coloured **X/Y/Z axes**, a **bounding box** and a **floor grid** (with X/Y/Z sprite labels). Switch from the in-view toggle **or** Settings → "3D Coordinate Space (axes)" (`inspector3dMode` in localStorage). Built from Three.js helpers and disposed cleanly (sprite textures freed).
- **Overlay toolbar (points 4 & 5):** left vertical floating toolbar — Undo, Redo, **Zoom in / Zoom out**, **Prev / Next page** arrows + a page indicator. Right cluster — Show chrome, Layers/3D-Space toggle, Hide Layers. Keys 1–9 jump pages.
- **Legend (point 6):** footer legend swatches are now derived directly from the `TYPE_COLOURS` palette, so they always match the cards.

### Help (`help.js`)
- Added help entries for Shapes & Lines, Barcodes & QR, the 3D Layers View, the two 3D view modes, and the Approval workflow; updated the Document Elements entry and the index. Added workflow steps 9–11. The downloadable Help Manual PDF is generated from these arrays, so it now includes all new features.

---

## Session 7 — 13 June 2026  (second bug-fix round: QR lib, shapes UX, 3D view)

### §4 QR — switched to `qrcodejs` (davidshimjs) (`barcodes.js`)
- Now loads `cdnjs qrcodejs@1.0.0` (`qrcode.min.js`, with SRI integrity + `crossorigin`/`referrerpolicy`). `_injectScriptOnce(url, opts)` now accepts integrity/crossOrigin/referrerPolicy.
- `_generateQrDataUrl` rewritten for the constructor API `new QRCode(holder, {text,width,height,correctLevel})`; reads the rendered `<canvas>` (or `<img>` fallback) → PNG data URL. Verifies the `QRCode` constructor and never surfaces "undefined".

### §6 Shapes — easier to grab + clearer selection (`canvas-elements.js`)
- Rect/ellipse now set `pointer-events:all`, so clicking/right-clicking **inside** the shape works even when fill is "none" (point 4).
- All shapes get a table-style **grip "holder"** pill at the top for easy grab/move; a line (no interior) is moved/right-clicked via this bar (points 2 & 4).
- §5 A faint dashed **bounding border** now connects the 4 corner handles on both shapes and images, so the selection box is easy to see. Grip + border carry chrome classes (`svg-table-grip` / `img-resize-handle`) so they stay excluded from exports and resize live.

### §7 Approval — DRAFT chip removed from navbar (`workspace.html`)
- Removed the `#docStatusChip` "DRAFT" pill from the navbar (point 3). The per-page DRAFT watermark badge remains; `approval.js` already guards the chip lookup.

### §12 3D Layers — visibility fix + full-area black view (`inspector3d.js`)
- **Elements were invisible because the 2D `#canvas` was set to `display:none`**, making `getBBox()` return zeros (point 7). The canvas now stays rendered behind the overlay, so every text/image/table/shape renders as a card.
- Cards are stacked by **paint order** with a clear air gap between them (Firefox-style exploded view); on-top elements float higher.
- The view is now a **fixed black overlay filling everything below the navbar** (point 8). Undo / Redo / Hide-Layers float as a padded **control overlay** (point 6); the old x-icon header button is gone (Hide Layers + Esc close it).

---

## Session 6 — 13 June 2026  (bug-fix pass on points 1–8 + 3D layers rework)

### §12 3D Canvas Inspector → in-place "3D Layers" view (`inspector3d.js`, `style.css`)
- **Fixed crash:** constant was defined as `I3D_I3D_PAGE_GAP_MM` but referenced as `I3D_PAGE_GAP_MM` (ReferenceError on open / page-jump). Renamed to `I3D_PAGE_GAP_MM`.
- **Reworked rendering model (point 8):** the inspector no longer uses a full-screen overlay. On open it hides `#left-hand-menu` + `#right-hand-menu`, expands `#doc-canvas` to `col-12`, hides the 2D `#canvas`, and renders the WebGL view **in place** inside the middle column (Firefox-Tilt style). On close it restores all three. Works on macOS/Linux/Windows via Three.js WebGL.
- The **Show Layers** button now toggles to **Hide Layers** (icon + label + active style) and back.
- WebGL availability is tested *before* loading Three.js; renderer/camera re-size to the live container (deferred RAF re-size for first paint); right/middle-drag pan scales with zoom; raycast walks up to the mapped mesh; double-click exits and opens the element's 2D context menu.

### §6 Shapes — undo fix (`canvas-elements.js`)
- Shape line-endpoint drag and corner-resize called undefined `_pushToUndoStack`; corrected to `_pushUndoSnapshot` so shape resize/undo no longer throws.

### §4 Barcode / QR — "undefined" alert fix (`barcodes.js`)
- `_injectScriptOnce` now rejects with a real `Error` (was passing the raw error event → `err.message` was `undefined`).
- Added `_errMsg()` so all failure toasts show a readable message instead of "undefined".
- QR generation verifies the `QRCode` global, with a cdnjs fallback CDN, and throws a clear "QR library unavailable" if neither loads.
- `_addImageBoxAndGetGroup` no longer passes bogus 4th/5th args into `addImageBox(src,w,h,safeMargin)`.

### §7 Approval — admin-only visibility fix (`approval.js`)
- `_isAdmin()` / new `_getLoggedInUser()` now fall back to the `localStorage` copy of `loggedInUser` (sessionStorage may not be seeded yet on a fresh tab/reload).
- Approve/Revoke rows are re-evaluated on `window load` (after `setDefaults` seeds the user), in addition to `DOMContentLoaded`. Rows already render one below the other (admin-only).

### Verified (no change needed)
- §3 shape selector dropdown (rect/ellipse/line) wired correctly.
- §6 DRAFT badge aligns with the page-number (right) and Active (left) badges on the same `y=7` baseline, centered, and toggles with `docStatus`.

---

## Session 5 — 13 June 2026  (all 12 prospective features from prospective_steps.txt)

### §1 Template Variables + Mail Merge (`merge.js`, `letters.js`)
- All hardcoded sample data in `LETTER_LAYOUT_ELEMENTS`, `INVOICE_LAYOUT_ELEMENTS`, `ENVELOPE_LAYOUT_ELEMENTS` replaced with `{{variable}}` placeholders.
- New `merge.js`: `extractVariables()`, `applyVariables(valueMap, target, commit)`, `_resolveAutoVars()` (date/page/seq), `_parseCSV()` (hand-rolled, handles quoted fields + CRLF).
- Single-document fill: `openVariableFillModal()` / `applyVariableFill()`.
- Mail merge batch: `openMailMergeModal()`, `onMmCsvChange()`, `_buildMappingTable()`, `mmPreviewRow()` (non-destructive), `mmGenerate(outputMode)` — combined PDF or per-row PDFs. 200-row cap; 10-row cap on trial license. Bootstrap progress bar.
- Export helpers: `_exportVectorPDFPage()` / `_exportRasterPDFPages()` accept existing jsPDF instance (no `.save()`).

### §2 Brand Kit + Element Locking (`brandkit.js`, `shared-db.js`)
- DB_VERSION bumped to 2; added `printingBrandKit` and `printingSequences` stores; `clearStore()` helper.
- New `brandkit.js`: `loadBrandKit()` / `saveBrandKit()`, `getBrandKitVars()`, `openBrandKitModal()`, `insertLetterhead()`.
- Auto-variables `{{brand_company}}`, `{{brand_address}}`, `{{brand_email}}`, `{{brand_phone}}`.
- `toggleElementLock(el)` — admin-only; lock glyph via `.page-watermark.lock-indicator` + `style.display`.

### §3 Auto-Numbering Sequences (`merge.js`)
- `{{seq:name}}` variable syntax; increments only on commit (never on preview).
- Sequence manager UI inside Brand Kit modal: `seqCreate()`, `seqUpdateNext()`, `seqDelete()`.

### §4 Barcode / QR Elements (`barcodes.js`)
- New `barcodes.js`: lazy CDN load (`jsbarcode@3.11.6`, `qrcode@1.5.4`).
- `openBarcodeModal()` / `confirmAddBarcode()`, `openQrModal()` / `confirmAddQr()`.
- `regenerateBarcodes(valueMap)` in `merge.js` re-renders variable barcodes per mail-merge row.

### §5 Label-Sheet Layouts (`labels.js`)
- New `labels.js`: `LABEL_SHEETS` table (L7160, L7163, L7165, L7173); `applyLabelSheet()`, guide rects (`.page-watermark.label-guide`), slot-1 template, `replicateLabelSlots()` on temp clone.
- "Labels" added to documenttype dropdown; `labelSheetModal` added.

### §6 Shapes & Lines (`canvas-elements.js`, `canvas-interactions.js`, `scripts.js`)
- `addShapeBox(kind, x, y, w, h)` — rect / ellipse / line; full undo/reattach/counter wiring.
- Context menu: stroke, fill, stroke-width, corner-radius controls.

### §7 Approval Workflow (`approval.js`)
- `approveDocument()` / `unapproveDocument()` (admin-only); navbar `#docStatusChip`.
- `_stampWatermarkOnCanvas()` / `_stampWatermarkOnPdf()` / `shouldStampWatermark()` integrated into both PDF export pipelines.

### §8 Offline Licensing (`license.js`)
- ECDSA P-256 signature verification via SubtleCrypto; `License.current()` / `.has(feature)` / `.activate()`.
- Clock-tamper detection, expiry warnings, trial enforcement (row cap, page cap, TRIAL watermark, vector PDF gate).
- `tools/generate_license.mjs` CLI key-generation tool.

### §9 Workspace Backup / Restore (`exports.js`, `imports.js`)
- `exportWorkspaceBackup()` downloads `printflow-backup-YYYYMMDD.json`.
- `importWorkspaceBackup(file)` / `onBackupFileChange(e)` — validates, confirms, clears stores, restores, redirects.

### §10 Editor QoL (`canvas-interactions.js`)
- Duplicate element (context menu), copy/paste (`_clipboardJson`, Ctrl+C/V).
- Smart alignment guides during drag (rAF-throttled, excluded from export).
- Arrow-key nudge 1 mm / Shift 5 mm with 500 ms debounce undo burst.

### §11 PWA (`sw.js`, `manifest.json`, `icons/`)
- Cache-first SW for same-origin + pinned CDN assets; network-first fallback; `CACHE_VERSION` bump mechanism.
- SW registered from `shared-db.js`; `<link rel="manifest">` added to both pages.

### §12 3D Canvas Inspector (`inspector3d.js`)
- Three.js r0.158 lazy-loaded; full-viewport overlay; custom orbital controls.
- Colour-coded extruded boxes by element type; raycasting; info panel; Bring/Send z-order.
- MutationObserver live sync; full GPU teardown on close; keyboard shortcuts.

### workspace.html UI wiring
- All new modals: `variableFillModal`, `mailMergeModal`, `brandKitModal`, `barcodeModal`, `qrModal`, `licenseModal`, `labelSheetModal`.
- All new left/right panel buttons and settings switches.
- Updated script load order (13 scripts total added).

### Validation
- `node --check` clean on all 14 new/modified JS files.
- All 63 onclick/onchange handlers verified against JS definitions — none missing.
- No duplicate element IDs.

---

## Sessions 1–4 — (prior history)

## Session 1

### `layout.js`
- **[T1] `setGridSize` pageDimensions duplicate removed** — the local object only covered A4/A5/C4 and would silently fail for envelope sizes (DL, C4, C5, Num10). Removed the local copy; function now uses the global `pageDimensions` from `scripts.js`.
- **[T5] Bleed zone added** — `setBleedZone(width, height, pageGroup, bleedMm=3)` draws a red dashed rect 3 mm outside the page boundary. Hidden by default; toggled via `toggleBleedZone()`.
- **[T5] `toggleBleedZone`** — persists state to `sessionStorage("bleedZoneDisplay")`.
- **[T5] `getEffectiveDpi`** — reports the effective DPI at which the SVG canvas is currently displayed. Informational only; SVG is resolution-independent.
- **[T5] `layoutSvgCanvas`** — now calls `setBleedZone` after building the canvas structure.

### `exports.js`
- **[T2] `showVersionHistory` removed** — was dead code that also overwrote `innerText` inside a loop, meaning only the last entry would ever be visible.
- **[T3] `saveAppSettings` rewritten** — old version toggled menu items as a side effect (corrupting visibility state) and never persisted the result. New version reads `.classList.contains("hidden")` without mutation and saves to `sessionStorage`.
- **[T3] `loadAppSettings` added** — parses saved panel visibility from `sessionStorage` and applies `hidden` class on load. Called from `onloadInit`.
- **[T3] `resetAppSettings`** — unchanged but verified correct.

### `imports.js`
- **[T4] Duplicate `SVG_NS` removed** — was re-declared as a local `const` inside the file body. Now uses the global from `layout.js`.
- **[T6] `loadSelectedTemplateFile` bug fixes**:
  - Removed `alert(JSON.stringify(templateData))` debug statement left in production path.
  - Fixed copy-paste bug: `let y = element.x` changed to `let y = element.y` for table elements.
- **[T6] `confirmRawImportFile`** — now re-attaches interactions for `tableBox` and `imageBox` element types on JSON import (previously only `textBox` was handled).
- **[T10] Image loading from template fixed** — `URL.createObjectURL(element.src)` replaced with direct use of `element.src` (now a base64 data URL stored in the template record).

### `scripts.js`
- **[T4] Duplicate `SVG_NS` removed** — was re-declared as `let SVG_NS` inside `updateTableDimensions`. Now uses the global.
- **[T3b] `loadAppSettings()` wired into `onloadInit`** — ensures panel visibility is restored on every page load.
- **[T6] `toggleSafeZone` fixed** — was using `style.display = "none" / "block"` on an SVG `<rect>`, which SVG doesn't support. Changed to `setAttribute("visibility", "hidden"/"visible")`.
- **[T6] `changeSafeZoneSize` fixed** — was passing `svgRoot` (the root `<svg>`) to `setSafeZone`, which expects `pageGroup` (`<g>`). Fixed to `document.getElementById("pageGroup")`.
- **[T6] `resetZoom`** — now also rebuilds rulers via `buildRulers()` so ruler scale matches the reset zoom level.
- **[T6] `setDefaults`** — added `tableBox: 0` to the stats object (was missing; caused `NaN` on tableBox stat updates).
- **[T6] Element `elementType` attribute** — `addTextBox`, `addTableBox`, and `addImageBox` now set `elementType` attribute on their root SVG elements. This allows `removeElement` to correctly decrement the right stat counter.
- **[T6] `addTextBox` / `addTableBox`** — now call `modifyStats(...)` and `updateElementCounters()` to keep live element counters accurate.
- **[T6] `removeElement`** — now calls `updateElementCounters()` after removal.
- **[T5] `exportAsPDF`** — fixed `onclone` callback to hide `.text-highlight` rects and `#bleedZone` guide before capture. Uses actual page width/height from `pageDimensions` for correct output dimensions.
- **[T5] `previewPrint` replaced** — the 5-second auto-reverting timeout was removed. `enterPreviewMode()` hides all UI, `exitPreviewMode()` restores it. An "Exit Preview" button is shown while in preview mode.
- **[T6] `onMove` drag handler** — added snap-to-grid logic (rounds translate coords to nearest `gridSize` multiple when `snapToGrid` is enabled in sessionStorage). Also added throttled safe-zone overlap warning during drag.
- **[T6] `onUp` drag-end** — calls `checkElementOverlap(box)` to warn when elements sit exactly on top of each other.
- **[T6] New: `checkElementOverlap(movedBox)`** — detects when the moved element's bounding rect fully contains another element's bounding rect and shows a warning toast.
- **[T6] New: `updateElementCounters()`** — reads live DOM count of each element type and updates the counter badges in the UI.
- **[T6] New: `toggleSnapToGrid()`** — persists `snapToGrid` flag in sessionStorage; the drag handler reads it.
- **[T6] New: `toggleLockAllElements()`** — locks/unlocks all `.design-object` elements by adding/removing the `locked` class; updates the lock button icon.
- **[T6] New: `restoreVersion(versionId)`** — full implementation replacing the `window.alert('Loading Version...')` stub. Fetches from `printingVersionLogs`, clears content-layer, reconstructs DOM via `jsonToDom`, and re-attaches interactions.

### `darkmode.js`
- **[T4] Dark mode persistence on reload** — added IIFE that reads `sessionStorage("displayMode")` on script load and re-applies `body.dark-mode` class if saved as `"dark"`.

### `stats.js`
- **[T2] `loadAuditHistory` empty-state fix** — the "No Audit Entry Found" fallback HTML was inside the `forEach` loop on an empty array (forEach on empty = no-op). Moved to an explicit `if (records.length === 0)` branch.
- **[T2] `loadVersionHistory` same fix** — identical bug; same fix applied.
- **[T6] `loadVersionHistory`** — version items now render as clickable buttons with `onclick="restoreVersion('${log.id}')"` and human-readable timestamps.

### `style.css`
- **[T4] Dark mode SVG rules overhauled** — the broad `.dark-mode g`, `.dark-mode line`, `.dark-mode text` rules (which turned everything amber including the page rect) were replaced with targeted rules:
  - `#pageRect` always stays white (fill/stroke).
  - `#safeZone` uses a mid-grey dashed border.
  - `#bleedZone` keeps its red stroke.
  - `#rulers-layer line` uses amber.
  - `#rulers-layer text` uses amber fill, no stroke.
  - `#gridPath` uses a dark grey (not amber) so the grid stays subtle.

### `workspace.html`
- **[T4] Lock All button** added to document-elements card (`id="lockAllBtn"`).
- **[T4] Element counters** added: `id="elemCountText"`, `id="elemCountImage"`, `id="elemCountTable"`.
- **[T4] Snap to Grid toggle** added in grid-controls card.
- **[T4] Bleed Guide toggle** added in safe-zone-controls card.

### `index.html`
- **[T15] SHA-256 password hashing** — `hashPassword(plainText)` uses `crypto.subtle.digest("SHA-256", ...)` via SubtleCrypto API. Passwords are hashed before storage (`checkAndCreateUser`) and before comparison (`loginUser`). Plain-text passwords are never written to IndexedDB.
- **[T15] Debug `window.alert(JSON.stringify(user))` removed** from `loginUser`.
- **[T15] Input validation cleaned up** — empty-string guards now use truthiness checks (`if (!username)`) rather than comparing against the string `"none"`.

---

## Session 2

### `scripts.js` (continued)
- **[T11] Undo/Redo stack** — `_undoStack` / `_redoStack` arrays (max 20 entries each). `captureSnapshot()` serialises the content-layer to JSON and pushes to `_undoStack`. `undo()` pops from `_undoStack`, pushes current state to `_redoStack`, and restores. `redo()` reverses this. `_applySnapshot()` handles DOM reconstruction and interaction re-attachment. Keyboard shortcuts: `Ctrl+Z` = undo, `Ctrl+Y` / `Ctrl+Shift+Z` = redo.
- **[T11] Snapshot capture points** — `captureSnapshot()` is called before: `addTextBox`, `addTableBox`, `addImageBox`, `removeElement`, and drag-end (`onUp`). Z-order and alignment functions also call it.
- **[T12] Z-order controls** — `bringToFront`, `bringForward`, `sendBack`, `sendToBack` manipulate SVG DOM child ordering (later sibling = visually on top). All four call `captureSnapshot()` before mutating.
- **[T13] Alignment tools** — `alignLeft`, `alignCentreH`, `alignRight`, `alignTop`, `alignMiddleV`, `alignBottom` compute pixel → mm conversion from the `#pageRect` bounding rect, then adjust the element's `translate()` transform. All call `captureSnapshot()`.
- **[T12+T13] Context menu updated** — a shared HTML block (Layer Order + Align to Page) is now appended to all three element type context menus (textBox, imageBox, tableBox).
- **[T14] Image resize — aspect-ratio lock** — `toggleImageResize` now reads an `id-aspectLock` checkbox. When checked, height is auto-calculated from the original aspect ratio when width changes. Width input has an `oninput` handler that live-updates the height field while typing. Fixed a pre-existing bug: was destructuring `{pageWidth, pageHeight}` from `pageDimensions` but actual keys are `{width, height}`.
- **[T14] Image context menu updated** — Dimensions input now labelled "mm" (not "px"); aspect-ratio checkbox shown; height input updates live.
- **[T10] `getImageUrl` rewritten** — now returns a `Promise<base64 data URL>` via `FileReader.readAsDataURL`. The old `URL.createObjectURL` blob URL was temporary and would silently break after page reload or when images were loaded back from IndexedDB.
- **[T10] Image input handler** — detects natural image dimensions, scales to fit within 150 mm width (preserving aspect ratio), then calls `addImageBox`. Falls back to 100×100 on load error.

### `imports.js` (continued)
- **[T10] Template image loading fixed** — `URL.createObjectURL(element.src)` replaced with direct `element.src` since images are now stored as base64 data URLs in IndexedDB template records.

---

## Session 3 — 11 June 2026 (Priority 1 completion + fresh audit)

### `index.html`
- **Splash `<main>` id renamed `workspace` → `splash-shell`** — collided with the SVG canvas id used by scripts.js, causing `onloadInit()` to run and crash on the login page and mousemove errors over the splash.
- **Splash-skip setting honoured** — when `localStorage("showSplashScreen") === "false"`, body gets `loaded` immediately.

### `workspace.html`
- Dark-mode checkbox gets `id="darkModeCheckbox"`; splash checkbox gets `id="splashScreenCheckbox"`.
- Settings label fixed: "Save Export as SVG (default: JSON)" (was "HTML").
- Duplicate ids fixed: Num10_E item → `pageType6`; raw export/import confirm buttons → `confirmRawExportFileBtn` / `confirmRawImportFileBtn` (were all `confirmExportPDFBtn`).

### `scripts.js`
- settingsModal `DOMContentLoaded` listener null-guarded (crashed on index.html).
- `openSettingsModal` syncs dark-mode + splash checkboxes via ids.
- `setDefaults` stats gained `svg` keys for fileExports/fileImports.

### `darkmode.js`
- New `_syncDarkModeCheckbox()` — runs on load and after every `toggleDarkMode()`.

### `exports.js`
- `saveExportMode` defaults to "json" and toggles correctly (first toggle previously did nothing).
- `confirmRawExportFile` defaults fileMode to "json" — unset fileMode used to write JSON content into a `.svg` file. Stats update guards unknown keys.
- **New `toggleSplashScreen()`** — was referenced in Settings but never defined (ReferenceError).
- **New `restoreAppSettings()`** — was referenced in Settings but never defined (ReferenceError).

### `imports.js`
- File extension read via `split(".").pop().toLowerCase()` (first-dot bug).
- **SVG import rebuilt** — previously injected the entire exported workspace SVG (rulers, pages, duplicate ids) into page 1's content layer. Now parses via DOMParser, imports only content-layer children per page, syncs page count, re-attaches interactions.
- Import stats guard for unknown extensions.

### `letters.js`
- `saveCustomTemplate` null-safe input extraction — dynamic element blocks have no table inputs, so saving with 2+ blocks crashed with TypeError. Table fields now parsed numerically (`isNaN("")` false-positive fixed).

### `canvas-elements.js`
- `updateTableDimensions`: rebuilt cells get ids + `cell-text` class (cell editing broke after any resize), existing cell text preserved, `captureSnapshot()` for undo, drag grip re-added.
- `addSvgTableGrip`: pill appended before dots (dots were painted under the pill).

### `layout.js`
- `hideLeftHandMenuOptions("all-left-hand-side")` list completed with `safe-zone-controls` and `print-controls`.

---

## Session 4 — Priority 2 features, architecture (P3b/d/e), undo/redo overhaul

### Undo/Redo — fixed across all features
The core defect: snapshots were captured AFTER mutations, so undo restored the post-change state (a no-op). Contract now documented in scripts.js: snapshots hold PRE-change state.
- `addTextBox` / `addTableBox` / `addImageBox` — `captureSnapshot()` moved BEFORE the DOM insert (was after → undo of an add did nothing).
- **Drag** — pre-drag state serialised on mousedown/touchstart, pushed via new `_pushUndoSnapshot()` on mouseup only if the element moved (was snapshotting after the move → undo of a drag did nothing).
- **Image corner-resize** — pre-state serialised on handle mousedown, pushed on first actual move (plain handle clicks no longer pollute the stack).
- **Context-menu edits** — text/cell typing captures once per menu session (`_captureOnceForContextEdit`, reset on menu open); font size, bold, italic, rotate, flip capture per action (previously none of these were undoable).
- **Table row/column resize** — captures before rebuild.
- **Draft autosave decoupled** — drafts previously stored the PRE-change snapshot (always one step behind). New `_scheduleDraftSave()` persists the post-change state after the call stack unwinds; also runs on undo/redo.

### P2a — Inline table cell editing (settings toggle)
- Double-click a cell → `<foreignObject>` input positioned exactly over the cell; Enter/blur commits, Escape cancels; undoable. New Settings switch "Inline Table Cell Editing" (`toggleInlineCellEdit`, localStorage) so both UX options can be tested; off = context-menu editing as before. Editor excluded from serialisation (`domToJson` skips `.cell-edit-fo`).

### P2b + P3d — Multi-page PDF export, vector option
- `exportAsPDF` split into `_exportRasterPDF` / `_exportVectorPDF`. Raster: capture once at 3×, slice per page (offset = RULER_SIZE_MM + (p-1)·(pageH+PAGE_GAP_MM)), one PDF page per canvas page — previously the whole stacked canvas was squashed into one page. Table grips now excluded from capture.
- Vector: svg2pdf.js 2.2.4 (CDN, registers `pdf.svg()`); each page group cloned into a standalone origin-aligned SVG, UI chrome stripped, rendered as true vectors. New Settings switch "Vector PDF Export" (`toggleVectorPdf`); falls back to raster if the library is unavailable.

### P2c — Settings panel toggles completed
- Left tab: new switches for Safe Zone Controls and Printing/Export menus.
- Right tab: "Hide App Space Usage" previously toggled `app-downloads` (wrong target) — fixed; new "Hide App Downloads" switch added; "Audit History::" typo fixed.
- `saveAppSettings` now persists the four right-panel cards too.

### P2d — Image rotate + flip composed
- New `_applyImageTransform()` composes `translate(c) rotate(a) scale(sx,sy) translate(-c)` from `data-rotate` / `data-scale-x/y`. Rotate and flip no longer overwrite each other; recomposed after context-menu resize (centre moves).

### P2e — Table resize geometry
- `updateTableDimensions` reads the existing first-cell rect for col/row size (was hardcoded 20×10 — custom sizes reset) and takes position from the `translate()` transform in mm (was `getCTM()` — included zoom scale, so limits were wrong at any zoom ≠ 100%).

### P2f/g — Preview mode
- Exit restores the focused text box's selection highlight.
- Exit restores the user's pre-preview zoom (was forced to 100%).

### P3b — shared-db.js split
- All IndexedDB helpers extracted to `shared-db.js`. workspace.html loads it first; index.html loads ONLY it (plus Bootstrap) — the login page no longer executes any canvas code.

### P3e — Implicit-global argument pattern removed
- All `(STORE_NAME = storeName)` and `(type = "...")` call sites replaced with plain arguments (exports.js, imports.js, stats.js, letters.js, canvas-elements.js). The mutable global `STORE_NAME` is gone.

---

## Bugs Not Yet Fixed (tracked for reference)
- `stats` in sessionStorage is reset on every `onloadInit()` call — export/import counts are lost on any canvas reset. The stats reset and the layout reset are conflated inside `setDefaults`.
- `initDB()` is called fresh on every DB operation — connection should be opened once and cached.
- `stats.js` polls every 5 seconds via `setInterval` — should be event-driven.
- Dark mode has no CSS cascade for SVG content-layer user elements (placed text/images/tables). The page rect and rulers are now correctly themed; user content inherits SVG defaults.
