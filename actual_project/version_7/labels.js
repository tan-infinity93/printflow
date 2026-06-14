/**
 * labels.js — §5 Label-sheet layouts (Avery-style)
 *
 * Adds a "Labels" document preset. The user picks a sheet format; guide rects
 * (page-watermark label-guide) mark every slot. Slot 1 gets a single editable
 * text group as the template cell.
 *
 * On export or mail-merge, the slot-1 content is replicated into every slot
 * on a TEMPORARY CLONE — the live canvas is NEVER permanently mutated.
 *
 * Load order: after letters.js (same section), before merge.js.
 */

/* ============================================================
   LABEL SHEET DEFINITIONS
   All dimensions in mm. marginTop/Left = gap from paper edge to first label.
   gutterX/Y = gap between labels.
   ============================================================ */

const LABEL_SHEETS = {
  "L7160 (63.5×38.1, 3×7, A4)": {
    page:       "A4",
    cols:       3,
    rows:       7,
    labelW:     63.5,
    labelH:     38.1,
    marginTop:  15.1,
    marginLeft: 7.2,
    gutterX:    2.5,
    gutterY:    0,
  },
  "L7163 (99.1×38.1, 2×7, A4)": {
    page:       "A4",
    cols:       2,
    rows:       7,
    labelW:     99.1,
    labelH:     38.1,
    marginTop:  15.1,
    marginLeft: 4.65,
    gutterX:    2.5,
    gutterY:    0,
  },
  "L7165 (99.1×67.7, 2×4, A4)": {
    page:       "A4",
    cols:       2,
    rows:       4,
    labelW:     99.1,
    labelH:     67.7,
    marginTop:  13.5,
    marginLeft: 4.65,
    gutterX:    2.5,
    gutterY:    0,
  },
  "L7173 (99.1×57.0, 2×5, A4)": {
    page:       "A4",
    cols:       2,
    rows:       5,
    labelW:     99.1,
    labelH:     57.0,
    marginTop:  13.5,
    marginLeft: 4.65,
    gutterX:    2.5,
    gutterY:    0,
  },
};

/* Active sheet selection */
let _activeLabelSheet = null;

/* ============================================================
   OPEN LABEL SHEET PICKER
   ============================================================ */

const openLabelSheetModal = () => {
  const modalEl = document.getElementById("labelSheetModal");
  if (!modalEl) { showToast("labelSheetModal not found in HTML", "danger"); return; }
  new bootstrap.Modal(modalEl).show();
};

/* ============================================================
   APPLY LABEL SHEET
   Called from the modal "Apply" button.
   1. Sets page size to match the sheet definition.
   2. Draws guide rects for every slot (page-watermark label-guide).
   3. Drops one editable text group at slot 1 as the template cell.
   ============================================================ */

const applyLabelSheet = () => {
  const sel = document.getElementById("labelSheetSelect");
  if (!sel) return;
  const sheetName = sel.value;
  const sheet = LABEL_SHEETS[sheetName];
  if (!sheet) { showToast("Unknown sheet format", "danger"); return; }

  _activeLabelSheet = { name: sheetName, ...sheet };

  // Switch page size
  const pageSize = sheet.page;
  window.sessionStorage.setItem("pageSize", pageSize);
  layoutSvgCanvas(pageSize, true);
  const { width: pgW, height: pgH } = pageDimensions[pageSize];
  buildRulers(document.getElementById("workspace"), pgW, pgH);
  if (typeof _updatePageUI === "function") _updatePageUI();

  // Draw guides + slot-1 template on page 1
  _drawLabelGuides(1, sheet);
  _placeSlot1Template(1, sheet);

  bootstrap.Modal.getInstance(document.getElementById("labelSheetModal")).hide();
  showToast(`Label sheet "${sheetName}" applied — edit slot 1 as your template`, "success");
};

/* ============================================================
   DRAW GUIDE RECTS
   Each guide rect carries class "page-watermark label-guide" so it is
   excluded from all export pipelines (export-exclusion contract).
   ============================================================ */

const _drawLabelGuides = (pageNo, sheet) => {
  const cl = document.getElementById(`content-layer-${pageNo}`);
  if (!cl) return;

  // Remove any existing guides on this page
  cl.querySelectorAll(".label-guide").forEach((el) => el.remove());

  const { cols, rows, labelW, labelH, marginTop, marginLeft, gutterX, gutterY } = sheet;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = marginLeft + c * (labelW + gutterX);
      const y = marginTop  + r * (labelH + gutterY);

      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width",  labelW);
      rect.setAttribute("height", labelH);
      rect.setAttribute("fill",   "none");
      rect.setAttribute("stroke", "#aaa");
      rect.setAttribute("stroke-width", "0.3");
      rect.setAttribute("stroke-dasharray", "2 2");
      rect.classList.add("page-watermark", "label-guide");
      rect.style.display = "";
      rect.dataset.slotRow = r;
      rect.dataset.slotCol = c;
      cl.appendChild(rect);
    }
  }
};

/* ============================================================
   PLACE SLOT-1 TEMPLATE CELL
   A standard textBox dropped at slot [row=0, col=0]. User can edit it
   like any other text element. On export it is replicated into all slots.
   ============================================================ */

const _placeSlot1Template = (pageNo, sheet) => {
  const cl = document.getElementById(`content-layer-${pageNo}`);
  if (!cl) return;

  // Remove any previously placed slot-1 template marker
  cl.querySelectorAll("[data-label-slot1]").forEach((el) => el.remove());

  const { marginLeft, marginTop, labelW, labelH } = sheet;

  // Use the existing addTextBox infrastructure by temporarily setting
  // active page and overriding position via the returned element.
  captureSnapshot();
  if (typeof addTextBox === "function") {
    addTextBox("solo"); // adds at default position
    // The just-added group is the last child of the content layer
    const groups = cl.querySelectorAll(".svg-text-group");
    const newGroup = groups[groups.length - 1];
    if (newGroup) {
      newGroup.setAttribute("transform", `translate(${marginLeft}, ${marginTop})`);
      // Resize the inner rect/foreignObject to match label size
      const rect = newGroup.querySelector("rect.text-box-bg");
      if (rect) {
        rect.setAttribute("width",  labelW);
        rect.setAttribute("height", labelH);
      }
      newGroup.dataset.labelSlot1 = "true";
    }
  }
};

/* ============================================================
   REPLICATE SLOT-1 CONTENT INTO ALL SLOTS (for export/merge)
   Returns a CLONE of the content layer with all slots filled.
   The live canvas is NEVER mutated.
   ============================================================ */

const replicateLabelSlots = (pageNo, valueMap) => {
  if (!_activeLabelSheet) return null;

  const cl = document.getElementById(`content-layer-${pageNo}`);
  if (!cl) return null;

  const sheet = _activeLabelSheet;
  const { cols, rows, labelW, labelH, marginTop, marginLeft, gutterX, gutterY } = sheet;

  // Find the slot-1 template group
  const slot1 = cl.querySelector("[data-label-slot1]");
  if (!slot1) return null;

  // Deep-clone the entire content layer
  const cloneLayer = cl.cloneNode(true);

  // Remove all existing label-guide chrome from the clone (excluded from export)
  cloneLayer.querySelectorAll(".label-guide").forEach((el) => el.remove());

  // Remove the slot-1 marker from the clone (we'll re-place replicas)
  cloneLayer.querySelectorAll("[data-label-slot1]").forEach((el) => el.remove());

  let slotIdx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = marginLeft + c * (labelW + gutterX);
      const y = marginTop  + r * (labelH + gutterY);

      // Clone the template
      const slotClone = slot1.cloneNode(true);
      // Strip ids to avoid duplicates
      slotClone.removeAttribute("id");
      slotClone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

      // Position at this slot
      slotClone.setAttribute("transform", `translate(${x}, ${y})`);

      // Apply merge values if provided (for mail merge)
      if (valueMap && typeof applyVariables === "function") {
        applyVariables(valueMap, slotClone, false);
      }

      cloneLayer.appendChild(slotClone);
      slotIdx++;
    }
  }

  return cloneLayer;
};

/* ============================================================
   TOGGLE GUIDE VISIBILITY
   ============================================================ */

const toggleLabelGuides = () => {
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  for (let p = 1; p <= total; p++) {
    const cl = document.getElementById(`content-layer-${p}`);
    if (!cl) continue;
    cl.querySelectorAll(".label-guide").forEach((el) => {
      el.style.display = el.style.display === "none" ? "" : "none";
    });
  }
};

/* ============================================================
   POPULATE SHEET SELECT ON MODAL OPEN
   ============================================================ */

const openLabelSheetModalFull = () => {
  const sel = document.getElementById("labelSheetSelect");
  if (sel) {
    sel.innerHTML = Object.keys(LABEL_SHEETS).map(
      (name) => `<option value="${name}">${name}</option>`
    ).join("");
  }
  openLabelSheetModal();
};
