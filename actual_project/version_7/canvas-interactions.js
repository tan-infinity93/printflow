/**
 * canvas-interactions.js — Drag, context menu, z-order, alignment, element editing.
 * Depends on: layout.js (SVG_NS, getActivePage, pageDimensions referenced at call time)
 * Calls at runtime (defined in scripts.js):
 *   captureSnapshot, showToast, checkElementOverlap, modifyStats,
 *   updateElementCounters, updateUndoRedoCounts, _doClearCanvas
 */

/* ===========================
   Z-ORDER CONTROLS
=========================== */

/**
 * Parse the translate(x, y) from a transform attribute.
 */
const _getTranslate = (el) => {
  const t = el.getAttribute("transform") || "";
  const m = t.match(/translate\(\s*([\d.+-]+)[,\s]+([\d.+-]+)\s*\)/);
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 0, y: 0 };
};

/**
 * Get the element currently stored in sessionStorage as "divToBeClosed".
 */
const _activeEl = () =>
  document.getElementById(window.sessionStorage.getItem("divToBeClosed"));

const bringToFront = () => {
  const el = _activeEl();
  if (!el) return;
  captureSnapshot();
  el.parentElement.appendChild(el);
  showToast("Brought to front", "success");
};

const bringForward = () => {
  const el = _activeEl();
  if (!el) return;
  const next = el.nextElementSibling;
  if (!next) return;
  captureSnapshot();
  el.parentElement.insertBefore(next, el);
  showToast("Brought forward", "success");
};

const sendBack = () => {
  const el = _activeEl();
  if (!el) return;
  const prev = el.previousElementSibling;
  if (!prev) return;
  captureSnapshot();
  el.parentElement.insertBefore(el, prev);
  showToast("Sent backward", "success");
};

const sendToBack = () => {
  const el = _activeEl();
  if (!el) return;
  captureSnapshot();
  el.parentElement.prepend(el);
  showToast("Sent to back", "success");
};

/* ===========================
   DUPLICATE ELEMENT (§10)
=========================== */

/**
 * duplicateElement — deep-clones the active element, strips its id, assigns a
 * new uuid-based id, offsets +5/+5 mm, re-attaches interactions and counters.
 * captureSnapshot() BEFORE insert — undo contract.
 */
const duplicateElement = () => {
  const el = _activeEl();
  if (!el) return;
  if (el.classList.contains("locked")) { showToast("Unlock element before duplicating", "warning"); return; }

  const clone = el.cloneNode(true);

  // Assign new ids — walk the entire subtree
  const newRootId = "group-" + crypto.randomUUID();
  clone.setAttribute("id", newRootId);

  // Strip all nested ids to avoid duplicates
  clone.querySelectorAll("[id]").forEach((child) => {
    child.setAttribute("id", child.id + "-dup-" + crypto.randomUUID().slice(0, 8));
  });

  // Offset +5 mm in both axes
  const pos = _getTranslate(clone);
  clone.setAttribute("transform", `translate(${pos.x + 5}, ${pos.y + 5})`);

  // Remove lock glyph if any (clone might inherit)
  clone.querySelector(".lock-indicator")?.remove();
  clone.classList.remove("locked");

  captureSnapshot(); // BEFORE insert

  el.parentElement.appendChild(clone);
  if (typeof reattachInteractions === "function") reattachInteractions(clone);

  // Update stat
  const elType = clone.getAttribute("elementType");
  if (elType && typeof modifyStats === "function") modifyStats(elType, "add");
  if (typeof updateElementCounters === "function") updateElementCounters();

  showToast("Element duplicated (+5mm offset)", "success");
};

/* ===========================
   ALIGNMENT TOOLS
=========================== */

/**
 * Align the active element relative to the page area.
 * Works by adjusting the translate() transform directly in mm coordinates.
 */
const _alignElement = (direction) => {
  const el = _activeEl();
  if (!el) return;

  const pageSize = window.sessionStorage.getItem("pageSize") || "A4";
  const { width: pageW, height: pageH } = pageDimensions[pageSize];

  const activePg = (typeof getActivePage === "function") ? getActivePage() : 1;
  const pageRect = document.getElementById(`pageRect-${activePg}`);
  if (!pageRect) return;

  const pagePx = pageRect.getBoundingClientRect();
  const elPx = el.getBoundingClientRect();

  // mm per pixel
  const mmPerPxX = pageW / pagePx.width;
  const mmPerPxY = pageH / pagePx.height;

  // Element size in mm
  const elW = elPx.width * mmPerPxX;
  const elH = elPx.height * mmPerPxY;

  const pos = _getTranslate(el);
  const elLeft = (elPx.left - pagePx.left) * mmPerPxX;
  const elTop = (elPx.top - pagePx.top) * mmPerPxY;

  let newX = pos.x;
  let newY = pos.y;

  switch (direction) {
    case "left":
      newX = pos.x - elLeft;
      break;
    case "centre-h":
      newX = pos.x + (pageW / 2 - (elLeft + elW / 2));
      break;
    case "right":
      newX = pos.x + (pageW - (elLeft + elW));
      break;
    case "top":
      newY = pos.y - elTop;
      break;
    case "middle-v":
      newY = pos.y + (pageH / 2 - (elTop + elH / 2));
      break;
    case "bottom":
      newY = pos.y + (pageH - (elTop + elH));
      break;
  }

  captureSnapshot();
  el.setAttribute(
    "transform",
    `translate(${newX.toFixed(2)}, ${newY.toFixed(2)})`,
  );
  showToast(`Aligned ${direction}`, "success");
};

const alignLeft = () => _alignElement("left");
const alignCentreH = () => _alignElement("centre-h");
const alignRight = () => _alignElement("right");
const alignTop = () => _alignElement("top");
const alignMiddleV = () => _alignElement("middle-v");
const alignBottom = () => _alignElement("bottom");

/* ===========================
   CONTEXT MENU
=========================== */

/**
 * One pre-edit undo snapshot per context-menu session for continuous inputs
 * (text typing fires oninput per keystroke — snapshotting each one would
 * flood the stack). Reset every time the menu opens.
 */
let _ctxEditCaptured = false;
const _captureOnceForContextEdit = () => {
  if (_ctxEditCaptured) return;
  _ctxEditCaptured = true;
  captureSnapshot(); // DOM still holds the pre-edit state at this point
};

const showContextMenu = (target, elementType, event) => {
  _ctxEditCaptured = false;
  const canvas = document.getElementById("canvas");
  const contextMenu = document.getElementById("contextMenu");
  const targetRect = target.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const GAP = 6;

  let left = targetRect.right - canvasRect.left + GAP;
  let top = targetRect.top - canvasRect.top;

  // prevent overflow right
  if (left + contextMenu.offsetWidth > canvas.clientWidth) {
    left = targetRect.left - canvasRect.left - contextMenu.offsetWidth - GAP;
  }

  // prevent overflow bottom
  if (top + contextMenu.offsetHeight > canvas.clientHeight) {
    top = canvas.clientHeight - contextMenu.offsetHeight - GAP;
  }

  // Convert pixel offsets to mm using the canonical PX_PER_MM constant (96dpi)
  contextMenu.style.left = `${(left / PX_PER_MM).toFixed(2)}mm`;
  contextMenu.style.top  = `${(top  / PX_PER_MM).toFixed(2)}mm`;
  contextMenu.style.position = "absolute";
  contextMenu.style.zIndex = 9999;
  contextMenu.classList.remove("hidden");
  contextMenu.style.display = "block";

  const contextOptionsDiv = document.getElementById("contextOptions");
  const contextMenuTitle = document.getElementById("contextMenuTitle");
  let contextOptionsHTML;

  let textBoxValue = document.getElementById(`${target.id}`).textContent;

  if (elementType == "textBox") {
    if (contextMenuTitle) contextMenuTitle.innerHTML = '<i class="fa-solid fa-i-cursor me-1 text-primary"></i> Text Box';
    contextOptionsHTML = `
        <div class="context-menu-section px-3 py-2">
          <label class="context-menu-label">Text Content</label>
          <input type="text" class="form-control form-control-sm context-menu-input"
            id="svgTextBoxEditinput" value="${textBoxValue}"
            oninput="changeTextBoxTextContent('${target.id}')"
            placeholder="Enter text...">
        </div>
        <div class="d-flex justify-content-between px-3 pb-1" style="font-size:0.7rem;">
          <span class="text-muted">Chars: <span id="ctxCharCount">0</span></span>
          <span class="text-muted">Words: <span id="ctxWordCount">0</span></span>
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
            <span class="menu-text"><i class="fa-solid fa-text-height me-1 text-muted"></i>Font Size</span>
            <div class="d-flex align-items-center gap-1">
                <input type="number" class="form-control form-control-sm context-menu-input text-end p-1"
                       id="${target.id}-fontSize" min="4" max="20" value="4"
                       style="width: 42px;" onchange="changeTextBoxFontSize('${target.id}')">
                <span class="small text-muted">pt</span>
            </div>
        </div>
        <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
            <span class="menu-text"><i class="fa-solid fa-bold me-1 text-muted"></i>Bold</span>
            <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" role="switch" id="boldFontToggle"
                       onchange="toggleBoldFont('${target.id}')">
            </div>
        </div>
        <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
            <span class="menu-text"><i class="fa-solid fa-italic me-1 text-muted"></i>Italic</span>
            <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" role="switch" id="italicFontToggle"
                       onchange="toggleItalicFont('${target.id}')">
            </div>
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
          <span class="menu-text text-danger"><i class="fa-solid fa-trash-can me-1"></i>Remove TextBox</span>
          <button class="btn btn-sm btn-danger context-action-btn" id="removeElementBtn" onclick="removeElement()">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
    `;
  } else if (elementType == "imageBox") {
    // §7 QR/barcode are stored internally as images — show the right label.
    const _isQr      = target.dataset && target.dataset.qrSrc != null;
    const _isBarcode = target.dataset && target.dataset.barcodeSrc != null;
    const _imgLabel  = _isQr ? "QR Code" : _isBarcode ? "Barcode" : "Image Box";
    const _imgIcon   = _isQr ? "fa-qrcode" : _isBarcode ? "fa-barcode" : "fa-image";
    if (contextMenuTitle) contextMenuTitle.innerHTML = `<i class="fa-solid ${_imgIcon} me-1 text-primary"></i> ${_imgLabel}`;
    contextOptionsHTML = `
        <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
            <span class="menu-text"><i class="fa-solid fa-rotate me-1 text-muted"></i>Rotate</span>
            <div class="d-flex align-items-center gap-1">
                <input type="number" class="form-control form-control-sm context-menu-input text-end p-1"
                       id="${target.id}-imageAngle" min="0" max="360" step="90" value="0"
                       style="width: 50px;" onchange="rotateImageAngle('${target.id}')">
                <span class="small text-muted">°</span>
            </div>
        </div>
        <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
            <span class="menu-text"><i class="fa-solid fa-left-right me-1 text-muted"></i>Flip Horizontal</span>
            <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" role="switch" id="flipImageToggle"
                       onchange="toggleImageFlip('${target.id}', true)">
            </div>
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-section px-3 py-2">
            <label class="context-menu-label"><i class="fa-solid fa-ruler-combined me-1"></i>Dimensions (mm)</label>
            <div class="d-flex gap-2 align-items-center mb-2">
                <input type="number" class="form-control form-control-sm context-menu-input text-center"
                       id="${target.id}-imageWidth" placeholder="W" step="0.5" style="width: 58px;"
                       oninput="(function(){
                         const lock = document.getElementById('${target.id}-aspectLock');
                         if (!lock || !lock.checked) return;
                         const grp = document.getElementById('${target.id}');
                         const el = (grp && grp.querySelector) ? (grp.querySelector('image') || grp) : grp;
                         if (!el) return;
                         const origW = parseFloat(el.getAttribute('width')) || 1;
                         const origH = parseFloat(el.getAttribute('height')) || 1;
                         const w = parseFloat(document.getElementById('${target.id}-imageWidth').value);
                         if (w > 0) document.getElementById('${target.id}-imageHeight').value = ((w / origW) * origH).toFixed(2);
                       })()">
                <span class="text-muted fw-bold">×</span>
                <input type="number" class="form-control form-control-sm context-menu-input text-center"
                       id="${target.id}-imageHeight" placeholder="H" step="0.5" style="width: 58px;">
                <button class="btn btn-sm btn-primary context-action-btn" onclick="toggleImageResize('${target.id}')">
                    Apply
                </button>
            </div>
            <div class="d-flex align-items-center gap-2">
                <input class="form-check-input m-0" type="checkbox" id="${target.id}-aspectLock" checked>
                <label class="form-check-label small text-muted" for="${target.id}-aspectLock">Lock aspect ratio</label>
            </div>
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
          <span class="menu-text text-danger"><i class="fa-solid fa-trash-can me-1"></i>Remove ${_imgLabel}</span>
          <button class="btn btn-sm btn-danger context-action-btn" id="removeElementBtn" onclick="removeElement()">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
    `;
  } else if (elementType == "tableBox") {
    console.log(target);

    const cellGroup = event.target.closest("g");
    let cellValue = "";
    let row = null;
    let col = null;

    const textEl = cellGroup.querySelector("text");
    if (!textEl) return;
    const value = textEl.textContent;
    console.log("Cell text:", value);

    const id = textEl.id;
    const regex = new RegExp("R(\\d+)C(\\d+)");
    const match = id.match(regex);

    if (match) {
      row = parseInt(match[1]);
      col = parseInt(match[2]);
    }

    console.log("Row:", row, "Col:", col);
    console.log(`${target.id}-R${row}C${col}`);
    cellValue = document.getElementById(
      `${target.id}-R${row}C${col}`,
    ).textContent;
    console.log(cellValue);

    if (contextMenuTitle) contextMenuTitle.innerHTML = '<i class="fa-solid fa-table me-1 text-primary"></i> Table';
    contextOptionsHTML = `
      <div class="context-menu-section px-3 py-2">
          <label class="context-menu-label"><i class="fa-solid fa-pen me-1"></i>Edit Cell [R${row}C${col}]</label>
          <div class="d-flex gap-1 align-items-center">
            <input type="text" class="form-control form-control-sm context-menu-input"
              id="svgTableCellEditInput" value="${cellValue}"
              oninput="changeTableCellContent('${target.id}', ${row}, ${col})"
              placeholder="Cell text...">
            <button class="btn btn-sm btn-outline-secondary" onclick="(function(){var el=document.getElementById('svgTableCellEditInput');if(el){el.value='';changeTableCellContent('${target.id}',${row},${col});}})()">Clear</button>
          </div>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
        <span class="menu-text"><i class="fa-solid fa-grip-lines me-1 text-muted"></i>Rows</span>
        <div class="d-flex align-items-center gap-1">
          <input type="number" class="form-control form-control-sm context-menu-input text-end p-1"
            id="${target.id}-tableRow" min="1" max="30" step="1" value="1"
            style="width: 50px;" onchange="updateTableDimensions('${target.id}')">
        </div>
      </div>
      <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
        <span class="menu-text"><i class="fa-solid fa-grip-lines-vertical me-1 text-muted"></i>Columns</span>
        <div class="d-flex align-items-center gap-1">
          <input type="number" class="form-control form-control-sm context-menu-input text-end p-1"
            id="${target.id}-tableColumn" min="1" max="10" step="1" value="1"
            style="width: 50px;" onchange="updateTableDimensions('${target.id}')">
        </div>
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
        <span class="menu-text text-danger"><i class="fa-solid fa-trash-can me-1"></i>Remove Table</span>
        <button class="btn btn-sm btn-danger context-action-btn" id="removeElementBtn" onclick="removeElement()">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
  }

  // --- shapeBox context menu (§6) ---
  if (elementType === "shapeBox") {
    if (contextMenuTitle) contextMenuTitle.innerHTML = '<i class="fa-solid fa-shapes me-1 text-warning"></i> Shape';
    const shapeEl = target.querySelector("rect, ellipse, line");
    const curStroke = shapeEl ? (shapeEl.getAttribute("stroke") || "#000000") : "#000000";
    const curFill   = shapeEl ? (shapeEl.getAttribute("fill")   || "none")    : "none";
    const curSW     = shapeEl ? (shapeEl.getAttribute("stroke-width") || "0.5") : "0.5";
    const curRx     = shapeEl && shapeEl.tagName === "rect" ? (shapeEl.getAttribute("rx") || "0") : "0";
    const curAngle  = parseFloat(target.dataset.shapeAngle || "0");
    const SWATCHES  = ["none","#000000","#ffffff","#0d6efd","#198754","#dc3545","#fd7e14","#6f42c1","#adb5bd"];
    const swatchHtml = (type) => SWATCHES.map((c) => `
      <button class="btn btn-sm p-0 border rounded" style="width:18px;height:18px;background:${c === "none" ? "transparent" : c};${c === "none" ? "background-image:repeating-linear-gradient(45deg,#ccc 0,#ccc 2px,#fff 0,#fff 50%);background-size:6px 6px;" : ""}"
              title="${c}" onclick="${type === "stroke" ? "changeShapeStroke" : "changeShapeFill"}('${target.id}','${c}')"></button>
    `).join("");
    contextOptionsHTML = `
      <div class="context-menu-section px-3 py-2">
        <label class="context-menu-label"><i class="fa-solid fa-pen me-1"></i>Stroke Color</label>
        <div class="d-flex flex-wrap gap-1">${swatchHtml("stroke")}</div>
      </div>
      <div class="context-menu-section px-3 py-2">
        <label class="context-menu-label"><i class="fa-solid fa-fill me-1"></i>Fill Color</label>
        <div class="d-flex flex-wrap gap-1">${swatchHtml("fill")}</div>
      </div>
      <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
        <span class="menu-text"><i class="fa-solid fa-border-style me-1 text-muted"></i>Stroke Width (mm)</span>
        <input type="number" class="form-control form-control-sm context-menu-input text-end p-1"
               min="0.1" max="5" step="0.1" value="${curSW}" style="width:55px;"
               onchange="changeShapeStrokeWidth('${target.id}', this.value)">
      </div>
      ${target.dataset.shapeKind === "rect" ? `
      <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
        <span class="menu-text"><i class="fa-solid fa-square-full me-1 text-muted"></i>Corner Radius (mm)</span>
        <input type="number" class="form-control form-control-sm context-menu-input text-end p-1"
               min="0" max="20" step="0.5" value="${curRx}" style="width:55px;"
               onchange="changeShapeCornerRadius('${target.id}', this.value)">
      </div>` : ""}
      <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
        <span class="menu-text"><i class="fa-solid fa-rotate me-1 text-muted"></i>Rotation (°)</span>
        <input type="number" class="form-control form-control-sm context-menu-input text-end p-1"
               min="-180" max="180" step="1" value="${curAngle}" style="width:55px;"
               onchange="changeShapeRotation('${target.id}', this.value)">
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-2">
        <span class="menu-text text-danger"><i class="fa-solid fa-trash-can me-1"></i>Remove Shape</span>
        <button class="btn btn-sm btn-danger context-action-btn" id="removeElementBtn" onclick="removeElement()">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
  }

  // --- Shared: Z-Order + Alignment + Duplicate + Lock ---
  const sharedToolsHTML = `
    <div class="context-menu-divider"></div>
    <div class="context-menu-section px-3 py-2">
      <label class="context-menu-label"><i class="fa-solid fa-layer-group me-1"></i>Layer Order</label>
      <div class="d-flex gap-1 flex-wrap">
        <button class="btn btn-sm context-tool-btn" onclick="bringToFront()" title="Bring to Front"><i class="fa-solid fa-angles-up"></i></button>
        <button class="btn btn-sm context-tool-btn" onclick="bringForward()" title="Bring Forward"><i class="fa-solid fa-angle-up"></i></button>
        <button class="btn btn-sm context-tool-btn" onclick="sendBack()" title="Send Backward"><i class="fa-solid fa-angle-down"></i></button>
        <button class="btn btn-sm context-tool-btn" onclick="sendToBack()" title="Send to Back"><i class="fa-solid fa-angles-down"></i></button>
      </div>
    </div>
    <div class="context-menu-section px-3 py-2">
      <label class="context-menu-label"><i class="fa-solid fa-align-center me-1"></i>Align to Page</label>
      <div class="d-flex gap-1 flex-wrap">
        <button class="btn btn-sm context-tool-btn" onclick="alignLeft()" title="Align Left"><i class="fa-solid fa-align-left"></i></button>
        <button class="btn btn-sm context-tool-btn" onclick="alignCentreH()" title="Centre Horizontal"><i class="fa-solid fa-align-center"></i></button>
        <button class="btn btn-sm context-tool-btn" onclick="alignRight()" title="Align Right"><i class="fa-solid fa-align-right"></i></button>
        <button class="btn btn-sm context-tool-btn" onclick="alignTop()" title="Align Top"><i class="fa-solid fa-arrow-up"></i></button>
        <button class="btn btn-sm context-tool-btn" onclick="alignMiddleV()" title="Centre Vertical"><i class="fa-solid fa-arrows-up-down"></i></button>
        <button class="btn btn-sm context-tool-btn" onclick="alignBottom()" title="Align Bottom"><i class="fa-solid fa-arrow-down"></i></button>
      </div>
    </div>
    <div class="context-menu-section px-3 py-2">
      <label class="context-menu-label"><i class="fa-solid fa-copy me-1"></i>Actions</label>
      <div class="d-flex gap-1 flex-wrap">
        <button class="btn btn-sm context-tool-btn" onclick="duplicateElement()" title="Duplicate"><i class="fa-solid fa-clone"></i> Duplicate</button>
        <button class="btn btn-sm context-tool-btn ${target && target.classList.contains('locked') ? 'btn-warning' : ''}"
                onclick="toggleElementLock()" title="Lock/Unlock">
          <i class="fa-solid ${target && target.classList.contains('locked') ? 'fa-lock-open' : 'fa-lock'}"></i>
          ${target && target.classList.contains('locked') ? ' Unlock' : ' Lock'}
        </button>
      </div>
    </div>
  `;

  contextOptionsDiv.innerHTML = contextOptionsHTML + sharedToolsHTML;

  // Auto-focus and select-all the table cell input after DOM settles
  if (elementType === "tableBox") {
    setTimeout(() => {
      const cellInput = document.getElementById("svgTableCellEditInput");
      if (cellInput) { cellInput.focus(); cellInput.select(); }
    }, 50);
  }

  // Set initial char/word counts for textBox context menu
  if (elementType === "textBox") {
    const charCount = document.getElementById("ctxCharCount");
    const wordCount = document.getElementById("ctxWordCount");
    if (charCount) charCount.textContent = textBoxValue.length;
    if (wordCount) wordCount.textContent = textBoxValue.trim() ? textBoxValue.trim().split(/\s+/).length : 0;
  }

  // Svg custom attributes are fetched this way:
  let elementStatTobeReduced = target.getAttribute("elementType");

  window.sessionStorage.setItem("divToBeClosed", target.id);
  window.sessionStorage.setItem(
    "elementStatTobeReduced",
    elementStatTobeReduced,
  );
};

document.addEventListener("click", () => {
  hideContextMenu();
});

const hideContextMenu = () => {
  const contextMenu = document.getElementById("contextMenu");
  if (contextMenu) contextMenu.classList.add("hidden");
  activeElement = null;
};

/* ===========================
   TEXT BOX EDITING
=========================== */

const changeTextBoxTextContent = (textBoxId) => {
  _captureOnceForContextEdit();
  let text = document.getElementById("svgTextBoxEditinput").value;

  textBoxId = textBoxId.replace("group-", "");
  let svgTextBox = document.getElementById(textBoxId);

  const svgTextBoxWidth = parseFloat(svgTextBox.dataset.width);
  svgTextBox.dataset.rawText = text;

  svgTextBox.textContent = "";
  svgTextBox.textContent = text;

  wrapSvgText(svgTextBox, svgTextBoxWidth);

  // Update live char/word counters in context menu
  const charCount = document.getElementById("ctxCharCount");
  const wordCount = document.getElementById("ctxWordCount");
  if (charCount) charCount.textContent = text.length;
  if (wordCount) wordCount.textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
};

const changeTextBoxFontSize = (divID) => {
  captureSnapshot(); // discrete change — snapshot pre-state each time
  const fontSize = document.getElementById(`${divID}-fontSize`).value;

  const groupEl = document.getElementById(divID);
  const textEl = groupEl.querySelector("text");

  if (!textEl) return;

  // Set font-size as SVG attribute — not CSS style
  textEl.setAttribute("font-size", fontSize);

  // Rewrap since font size change affects line break points
  const maxWidth = parseFloat(textEl.dataset.width);
  const rawText =
    textEl.dataset.rawText ||
    Array.from(textEl.querySelectorAll("tspan"))
      .map((ts) => ts.textContent.trim())
      .filter(Boolean)
      .join("\n");

  textEl.dataset.rawText = rawText;
  textEl.textContent = rawText;

  wrapSvgText(textEl, maxWidth);
};

const toggleBoldFont = (divID) => {
  captureSnapshot();
  document.getElementById(divID).classList.toggle("text-box-bold");
};

const toggleItalicFont = (divID) => {
  captureSnapshot();
  document.getElementById(divID).classList.toggle("text-box-italic");
};

/* ===========================
   TABLE CELL EDITING
=========================== */

const changeTableCellContent = (divID, row, col) => {
  _captureOnceForContextEdit();
  let newCellValue = document.getElementById("svgTableCellEditInput").value;
  const cellEl = document.getElementById(`${divID}-R${row}C${col}`);
  if (cellEl) cellEl.textContent = newCellValue;
};

/* ===========================
   IMAGE TRANSFORM
=========================== */

/**
 * _applyImageTransform — composes rotation AND flip into ONE transform list.
 * Previously rotate and flip each overwrote the transform attribute, so
 * applying one cancelled the other. Both operate about the image centre:
 *   translate(cx,cy) rotate(a) scale(sx,sy) translate(-cx,-cy)
 */
const _applyImageTransform = (imgElement) => {
  const w = parseFloat(imgElement.getAttribute("width"))  || 0;
  const h = parseFloat(imgElement.getAttribute("height")) || 0;
  const cx = w / 2;
  const cy = h / 2;
  const angle  = parseFloat(imgElement.getAttribute("data-rotate"))  || 0;
  const scaleX = parseFloat(imgElement.getAttribute("data-scale-x")) || 1;
  const scaleY = parseFloat(imgElement.getAttribute("data-scale-y")) || 1;

  if (angle === 0 && scaleX === 1 && scaleY === 1) {
    imgElement.removeAttribute("transform");
    return;
  }
  imgElement.setAttribute(
    "transform",
    `translate(${cx}, ${cy}) rotate(${angle}) scale(${scaleX}, ${scaleY}) translate(${-cx}, ${-cy})`,
  );
};

const rotateImageAngle = (divID) => {
  const imgElement = _getImageEl(divID);
  if (!imgElement) return;

  captureSnapshot();
  const degrees = parseFloat(document.getElementById(`${divID}-imageAngle`).value) || 0;
  imgElement.setAttribute("data-rotate", degrees);
  _applyImageTransform(imgElement);
};

const toggleImageFlip = (divID, horizontal = false, vertical = false) => {
  const imgElement = _getImageEl(divID);
  if (!imgElement) return;

  captureSnapshot();
  let currentScaleX = parseFloat(imgElement.getAttribute("data-scale-x")) || 1;
  let currentScaleY = parseFloat(imgElement.getAttribute("data-scale-y")) || 1;

  if (horizontal === true) currentScaleX *= -1;
  if (vertical   === true) currentScaleY *= -1;

  imgElement.setAttribute("data-scale-x", currentScaleX);
  imgElement.setAttribute("data-scale-y", currentScaleY);
  _applyImageTransform(imgElement);
};

const toggleImageResize = (divID) => {
  const imgElement = _getImageEl(divID);
  if (!imgElement) return;

  const widthInput   = document.getElementById(`${divID}-imageWidth`);
  const heightInput  = document.getElementById(`${divID}-imageHeight`);
  const lockCheckbox = document.getElementById(`${divID}-aspectLock`);

  let newImgWidth  = parseFloat(widthInput.value);
  let newImgHeight = parseFloat(heightInput.value);

  if (!newImgWidth || newImgWidth <= 0) {
    showToast("Image width must be a positive number", "warning");
    return;
  }

  if (lockCheckbox && lockCheckbox.checked) {
    const origW = parseFloat(imgElement.getAttribute("width"))  || newImgWidth;
    const origH = parseFloat(imgElement.getAttribute("height")) || newImgHeight;
    if (origW > 0) {
      newImgHeight = (newImgWidth / origW) * origH;
      if (heightInput) heightInput.value = newImgHeight.toFixed(2);
    }
  }

  if (!newImgHeight || newImgHeight <= 0) {
    showToast("Image height must be a positive number", "warning");
    return;
  }

  const pageSize = window.sessionStorage.getItem("pageSize");
  const { width: pageWidth, height: pageHeight } = pageDimensions[pageSize];

  if (newImgWidth > pageWidth - 20 || newImgHeight > pageHeight - 20) {
    showToast("Image dimensions exceed page size", "warning");
    return;
  }

  captureSnapshot();
  imgElement.setAttribute("width",  `${newImgWidth.toFixed(2)}`);
  imgElement.setAttribute("height", `${newImgHeight.toFixed(2)}`);

  // Centre moved — recompose rotate/flip transform around the new centre
  _applyImageTransform(imgElement);

  // Reposition corner handles after manual resize via context menu
  const group = imgElement.closest(".svg-image-group");
  if (group) addSvgResizeHandles(group);

  showToast("Image resized", "success");
};

/* ===========================
   INLINE TABLE CELL EDITING
=========================== */

/**
 * _startInlineCellEdit — double-click a table cell to edit it in place.
 * Renders an <input> inside an SVG <foreignObject> positioned exactly over
 * the cell. Commit on Enter/blur, cancel on Escape.
 * Enabled via Settings ("Inline Table Cell Editing"); returns false when the
 * setting is off or the click didn't land on a cell, so the caller can fall
 * back to the legacy behaviour.
 */
const _startInlineCellEdit = (tableGroup, evt) => {
  if (localStorage.getItem("inlineCellEdit") !== "true") return false;

  const cellGroup = evt.target.closest("g");
  if (!cellGroup || cellGroup === tableGroup) return false;
  const rect   = cellGroup.querySelector("rect");
  const textEl = cellGroup.querySelector("text");
  if (!rect || !textEl) return false;

  // Only one editor at a time
  tableGroup.querySelectorAll(".cell-edit-fo").forEach((f) => f.remove());

  const m = (cellGroup.getAttribute("transform") || "")
    .match(/translate\(\s*([\d.+-]+)[,\s]+([\d.+-]+)\s*\)/);
  const cx = m ? parseFloat(m[1]) : 0;
  const cy = m ? parseFloat(m[2]) : 0;
  const w  = parseFloat(rect.getAttribute("width"))  || 20;
  const h  = parseFloat(rect.getAttribute("height")) || 10;

  const fo = document.createElementNS(SVG_NS, "foreignObject");
  fo.setAttribute("x", cx);
  fo.setAttribute("y", cy);
  fo.setAttribute("width",  w);
  fo.setAttribute("height", h);
  fo.classList.add("cell-edit-fo");

  const input = document.createElement("input");
  input.type = "text";
  input.value = textEl.textContent;
  // 1 CSS px inside the foreignObject == 1 SVG user unit (mm here),
  // so these sizes track the cell's mm dimensions.
  input.style.cssText =
    "width:100%;height:100%;box-sizing:border-box;" +
    "font-size:3px;line-height:1;padding:0 1px;" +
    "border:0.4px solid #0d6efd;outline:none;background:#fff;color:#000;";
  fo.appendChild(input);
  tableGroup.appendChild(fo);

  // Keep the drag/context-menu handlers from hijacking editor interaction
  ["mousedown", "dblclick", "contextmenu", "click"].forEach((t) =>
    fo.addEventListener(t, (ev) => ev.stopPropagation()),
  );

  let cancelled = false;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    fo.remove(); // remove BEFORE snapshot so the editor never gets serialised
    if (cancelled || input.value === textEl.textContent) return;
    captureSnapshot(); // DOM still holds the pre-edit text
    textEl.textContent = input.value;
  };

  input.addEventListener("keydown", (ev) => {
    ev.stopPropagation(); // don't trigger global undo/redo shortcuts
    if (ev.key === "Enter") input.blur();
    else if (ev.key === "Escape") { cancelled = true; input.blur(); }
  });
  input.addEventListener("blur", finish);

  setTimeout(() => { input.focus(); input.select(); }, 0);
  return true;
};

/* ===========================
   BOX INTERACTIONS (DRAG)
=========================== */

const enableBoxInteractions = (box, elementType) => {
  let isDragging = false;
  let didDrag = false; // true only if the mouse actually moved while pressed
  let startSVGPoint = null;
  let startTranslateX = 0;
  let startTranslateY = 0;
  let preDragSnapshot = null; // pre-drag state, pushed to undo only if moved

  const svg = box.ownerSVGElement;

  /* Helper: Convert mouse to SVG coords */
  function getMousePosition(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  /* Helper: Read current translate */
  function getCurrentTranslate() {
    const transform = box.getAttribute("transform");
    if (!transform) return { x: 0, y: 0 };

    const match = /translate\(([^,]+)[ ,]([^)]+)\)/.exec(transform);
    return match
      ? { x: parseFloat(match[1]), y: parseFloat(match[2]) }
      : { x: 0, y: 0 };
  }

  /* Double Click → Edit */
  box.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    if (box.classList.contains("locked")) return;
    // Inline table cell editing (Settings > Inline Table Cell Editing).
    // When disabled, cells are edited via the context menu as before.
    if (elementType === "tableBox" && _startInlineCellEdit(box, e)) return;
    enterEditMode(box);
  });

  if (elementType === "textBox") {
    box.addEventListener("blur", () => {
      box.setAttribute("contentEditable", "false");
    });
  }

  /* Drag Start */
  box.addEventListener("mousedown", (e) => {
    if (box.classList.contains("editing") || box.classList.contains("locked"))
      return;

    isDragging = true;
    didDrag = false;

    startSVGPoint = getMousePosition(e);
    // Serialise NOW (pre-drag) — pushed to the undo stack on mouseup only if
    // the element actually moved. Snapshotting after the move made undo a no-op.
    preDragSnapshot = _currentAllPagesSnapshot();

    const current = getCurrentTranslate();
    startTranslateX = current.x;
    startTranslateY = current.y;

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  /* Drag Move */
  function onMove(e) {
    if (!isDragging) return;
    didDrag = true;

    const currentSVG = getMousePosition(e);

    const dx = currentSVG.x - startSVGPoint.x;
    const dy = currentSVG.y - startSVGPoint.y;

    let updatedX = startTranslateX + dx;
    let updatedY = startTranslateY + dy;

    // Prevent negative movement
    updatedX = Math.max(0, updatedX);
    updatedY = Math.max(0, updatedY);

    // Snap-to-grid: round position to nearest grid step if enabled
    const snapEnabled = window.sessionStorage.getItem("snapToGrid") === "true";
    if (snapEnabled) {
      const gridStep = Number(window.sessionStorage.getItem("gridSize")) || 10;
      updatedX = Math.round(updatedX / gridStep) * gridStep;
      updatedY = Math.round(updatedY / gridStep) * gridStep;
    }

    // Safe Zone Warning (throttled to avoid toast spam)
    const SAFE_ZONE_LIMIT = 10;
    if (updatedX < SAFE_ZONE_LIMIT || updatedY < SAFE_ZONE_LIMIT) {
      if (!box._safeZoneWarned) {
        box._safeZoneWarned = true;
        if (typeof showToast === "function") {
          showToast("Crossing Safe Zone!", "warning");
        }
        setTimeout(() => {
          box._safeZoneWarned = false;
        }, 3000);
      }
    }

    // Update transform — SVG coordinate space is the only source of truth
    box.setAttribute("transform", `translate(${updatedX}, ${updatedY})`);

    // §10 Smart alignment guides (throttled via rAF)
    if (!box._guideRafPending) {
      box._guideRafPending = true;
      requestAnimationFrame(() => {
        box._guideRafPending = false;
        _drawAlignGuides(box, updatedX, updatedY);
      });
    }
  }

  /* Drag End */
  function onUp() {
    const wasDragged = didDrag;
    isDragging = false;
    didDrag = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    // Only snapshot + overlap-check if the element was actually moved
    if (wasDragged) {
      _pushUndoSnapshot(preDragSnapshot); // pre-drag state → undo restores it
      checkElementOverlap(box);
    }
    preDragSnapshot = null;
    _clearAlignGuides(); // remove guides on drop
  }

  /* Context Menu */
  box.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (box.classList.contains("locked")) return;
    showContextMenu(box, elementType, e);
  });

  /* Touch / Pointer Drag Support */
  let _longPressTimer = null;

  box.addEventListener("touchstart", (e) => {
    if (box.classList.contains("editing") || box.classList.contains("locked")) return;
    e.preventDefault();
    const touch = e.touches[0];
    const fakeEvt = { clientX: touch.clientX, clientY: touch.clientY };

    isDragging = true;
    didDrag = false;
    preDragSnapshot = _currentAllPagesSnapshot();
    startSVGPoint = getMousePosition(fakeEvt);
    const current = getCurrentTranslate();
    startTranslateX = current.x;
    startTranslateY = current.y;

    // Long press (600ms) → show context menu
    _longPressTimer = setTimeout(() => {
      if (!didDrag) {
        isDragging = false;
        showContextMenu(box, elementType, { preventDefault: () => {}, target: box });
      }
    }, 600);
  }, { passive: false });

  box.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    didDrag = true;
    clearTimeout(_longPressTimer);
    const touch = e.touches[0];
    onMove({ clientX: touch.clientX, clientY: touch.clientY });
  }, { passive: true });

  box.addEventListener("touchend", () => {
    clearTimeout(_longPressTimer);
    onUp();
  });
};

if (document.getElementById("removeElementBtn")) {
  document.getElementById("removeElementBtn").addEventListener("click", () => {
    if (activeElement) {
      activeElement.remove();
      activeElement = null;
    }
    closeContextMenu();
  });
}

/* ===========================
   IMAGE ELEMENT HELPER
=========================== */

/**
 * Helper: given an element id that may be an svg-image-group <g> or a bare <image>,
 * returns the <image> SVG element so attribute access works correctly.
 */
const _getImageEl = (id) => {
  const el = document.getElementById(id);
  if (!el) return null;
  if (el.tagName.toLowerCase() === "image") return el;
  return el.querySelector("image") || el;
};

/* ===========================
   EDIT MODE
=========================== */

function enterEditMode(box) {
  box.classList.add("editing");
  box.contentEditable = "true";
  box.focus();
}

function exitEditMode(box) {
  box.classList.remove("editing");
  box.contentEditable = "false";
  box.blur();
  resolveVerticalCollisions(box);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".text-box.editing").forEach(exitEditMode);
    closeContextMenu();
  }
});

const closeContextMenu = () => {
  const cm = document.getElementById("contextMenu");
  if (cm) cm.style.display = "none";
  activeElement = null;
};

/* ===========================
   REMOVE ELEMENT
=========================== */

const removeElement = () => {
  const divToBeClosed = window.sessionStorage.getItem("divToBeClosed");
  const currentElement = document.getElementById(divToBeClosed);
  if (!currentElement) return;

  captureSnapshot(); // save state before removal so it can be undone
  currentElement.parentElement.removeChild(currentElement);

  const elementStatTobeReduced = window.sessionStorage.getItem("elementStatTobeReduced");
  modifyStats(elementStatTobeReduced, "subtract");
  updateElementCounters();
};

/* ===========================
   §10 SMART ALIGNMENT GUIDES
=========================== */

const _GUIDE_TOLERANCE = 0.5; // mm

const _clearAlignGuides = () => {
  const svg = document.getElementById("workspace");
  if (!svg) return;
  svg.querySelectorAll(".align-guide").forEach((g) => g.remove());
};

const _drawAlignGuides = (box, bx, by) => {
  const svg = document.getElementById("workspace");
  if (!svg) return;
  _clearAlignGuides();

  const pageSize = window.sessionStorage.getItem("pageSize") || "A4";
  const pw = pageDimensions[pageSize]?.width || 210;
  const ph = pageDimensions[pageSize]?.height || 297;

  // Use getBBox for the moving box dimensions
  let bw = 0, bh = 0;
  try { const bb = box.getBBox(); bw = bb.width; bh = bb.height; } catch (_) {}

  const bCx = bx + bw / 2;
  const bCy = by + bh / 2;
  const bRight = bx + bw;
  const bBottom = by + bh;

  const others = document.querySelectorAll(".design-object");
  const SVG_NS = "http://www.w3.org/2000/svg";

  const makeGuide = (x1, y1, x2, y2) => {
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1);
    line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("stroke", "#f00"); line.setAttribute("stroke-width", "0.3");
    line.setAttribute("stroke-dasharray", "2,1");
    line.classList.add("page-watermark", "align-guide");
    line.style.display = "block";
    svg.appendChild(line);
  };

  others.forEach((el) => {
    if (el === box) return;
    let ox = 0, oy = 0, ow = 0, oh = 0;
    try {
      const bb = el.getBBox();
      const t  = _getTranslate(el);
      ox = t.x; oy = t.y; ow = bb.width; oh = bb.height;
    } catch (_) { return; }

    const oCx = ox + ow / 2;
    const oCy = oy + oh / 2;

    // Centre-X alignment
    if (Math.abs(bCx - oCx) < _GUIDE_TOLERANCE) {
      makeGuide(bCx, Math.min(by, oy) - 5, bCx, Math.max(bBottom, oy + oh) + 5);
    }
    // Centre-Y alignment
    if (Math.abs(bCy - oCy) < _GUIDE_TOLERANCE) {
      makeGuide(Math.min(bx, ox) - 5, bCy, Math.max(bRight, ox + ow) + 5, bCy);
    }
    // Left-edge alignment
    if (Math.abs(bx - ox) < _GUIDE_TOLERANCE) {
      makeGuide(bx, Math.min(by, oy) - 5, bx, Math.max(bBottom, oy + oh) + 5);
    }
    // Top-edge alignment
    if (Math.abs(by - oy) < _GUIDE_TOLERANCE) {
      makeGuide(Math.min(bx, ox) - 5, by, Math.max(bRight, ox + ow) + 5, by);
    }
  });
};

/* ===========================
   §10 ARROW-KEY NUDGE
=========================== */

// Module-level state for nudge burst debouncing
let _nudgePreSnap   = null;
let _nudgeDebounce  = null;

document.addEventListener("keydown", (e) => {
  // Skip if any input/foreignObject is focused
  const ae = document.activeElement;
  if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.tagName === "SELECT" ||
             ae.isContentEditable || ae.closest("foreignObject"))) return;

  // Arrow keys only
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (!arrows[e.key]) return;

  // Find a focused .design-object
  const focused = document.activeElement;
  if (!focused || !focused.classList || !focused.classList.contains("design-object")) return;
  if (focused.classList.contains("locked")) return;

  e.preventDefault();

  const step = e.shiftKey ? 5 : 1; // mm
  const [dx, dy] = arrows[e.key].map((v) => v * step);

  // Snapshot once at the START of a nudge burst
  if (!_nudgePreSnap) _nudgePreSnap = _currentAllPagesSnapshot();

  const pos = _getTranslate(focused);
  focused.setAttribute("transform", `translate(${Math.max(0, pos.x + dx)}, ${Math.max(0, pos.y + dy)})`);

  // Push undo snapshot 500 ms after last nudge key (one undo per burst)
  clearTimeout(_nudgeDebounce);
  _nudgeDebounce = setTimeout(() => {
    if (_nudgePreSnap) {
      _pushUndoSnapshot(_nudgePreSnap);
      _nudgePreSnap = null;
    }
  }, 500);
});

/* ===========================
   §10 COPY / PASTE (module clipboard)
=========================== */

let _clipboardJson = null; // serialised element (domToJson)

document.addEventListener("keydown", (e) => {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const ctrl  = isMac ? e.metaKey : e.ctrlKey;
  if (!ctrl) return;

  // Only when no input/foreignObject is focused
  const ae = document.activeElement;
  if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.tagName === "SELECT" ||
             ae.isContentEditable || ae.closest("foreignObject"))) return;

  if (e.key === "c" || e.key === "C") {
    const focused = document.activeElement;
    if (!focused || !focused.classList || !focused.classList.contains("design-object")) return;
    _clipboardJson = (typeof domToJson === "function") ? domToJson(focused) : null;
    if (_clipboardJson) showToast("Copied!", "success");
  }

  if (e.key === "v" || e.key === "V") {
    if (!_clipboardJson) return;
    const node = (typeof jsonToDom === "function") ? jsonToDom(_clipboardJson) : null;
    if (!node) return;

    // Assign new ids
    node.setAttribute("id", "group-" + crypto.randomUUID());
    node.querySelectorAll("[id]").forEach((child) => {
      child.setAttribute("id", child.id + "-paste-" + crypto.randomUUID().slice(0, 8));
    });

    // Offset +5mm
    const pos = _getTranslate(node);
    node.setAttribute("transform", `translate(${pos.x + 5}, ${pos.y + 5})`);

    captureSnapshot(); // BEFORE insert
    const cl = (typeof getActiveContentLayer === "function") ? getActiveContentLayer() : null;
    if (cl) {
      cl.appendChild(node);
      if (typeof reattachInteractions === "function") reattachInteractions(node);
      const elType = node.getAttribute("elementType");
      if (elType && typeof modifyStats === "function") modifyStats(elType, "add");
      if (typeof updateElementCounters === "function") updateElementCounters();
      showToast("Pasted!", "success");
    }
  }
});
