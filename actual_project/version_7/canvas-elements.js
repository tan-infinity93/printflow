/**
 * canvas-elements.js — SVG element creation: TextBox, ImageBox, Table.
 * Depends on: layout.js (SVG_NS, getActiveContentLayer)
 * Calls at runtime (defined in scripts.js / canvas-interactions.js):
 *   captureSnapshot, modifyStats, updateElementCounters,
 *   enableBoxInteractions, addSvgResizeHandles, showToast
 */

/* ===========================
   GRIP HOLDER BAR — shared dimensions (§13: slim profile for all components)
=========================== */
const GRIP_H     = 2.5;   // grip bar height in mm (was 4 — slimmer now)
const GRIP_DOT_R = 0.45;  // grip dot radius in mm
const GRIP_W_MAX = 18;    // max grip bar width in mm

/* ===========================
   TEXT WRAP UTILITY
=========================== */

const wrapSvgText = (textEl, maxWidth) => {
  if (!textEl || !textEl.ownerSVGElement) return;

  let rawText =
    textEl.dataset.rawText ||
    Array.from(textEl.querySelectorAll("tspan"))
      .map((ts) => ts.textContent)
      .join(" ") ||
    textEl.textContent;
  rawText = rawText.trim();

  const paragraphs = rawText.split("\n").map((p) => p.trim());

  // Clear existing tspans
  textEl.textContent = "";

  const fontSize = parseFloat(textEl.getAttribute("font-size"));

  const x = 0;
  const baseY = 0;

  // Re-assert x/y after clearing — safety net
  textEl.setAttribute("x", x);
  textEl.setAttribute("y", baseY);

  // Deterministic numeric line height
  const numericLineHeight = fontSize * 1.4;
  let lineIndex = 0;

  paragraphs.forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/);
    let line = "";

    let tspan = document.createElementNS(SVG_NS, "tspan");
    tspan.setAttribute("x", x);
    tspan.setAttribute("y", baseY + lineIndex * numericLineHeight);
    textEl.appendChild(tspan);

    for (const word of words) {
      const testLine = line + word + " ";
      tspan.textContent = testLine;

      if (tspan.getComputedTextLength() > maxWidth && line !== "") {
        // Lock previous line
        tspan.textContent = line;
        // Move to next line
        lineIndex++;
        line = word + " ";
        tspan = document.createElementNS(SVG_NS, "tspan");
        tspan.setAttribute("x", 0);
        tspan.setAttribute("y", lineIndex * numericLineHeight);
        textEl.appendChild(tspan);
        tspan.textContent = line;
      } else {
        line = testLine;
      }
    }

    tspan.textContent = line;

    // After paragraph, move to next line
    lineIndex++;
  });
};

/* ===========================
   ADD TEXT BOX
=========================== */

const addTextBox = (
  role,
  x = 20,
  y = 40,
  w = 60,
  textContent = "Sample Text",
  fontSize = 4.0,
) => {
  const g = document.createElementNS(SVG_NS, "g");
  const textBox = document.createElementNS(SVG_NS, "text");
  const highlight = document.createElementNS(SVG_NS, "rect");

  const id = crypto.randomUUID();
  g.setAttribute("id", `group-${id}`);
  g.setAttribute("tabindex", "0"); // Makes it focusable
  g.classList.add("svg-text-group");

  // Setup Highlight Rect (Hidden by default via CSS)
  highlight.classList.add("text-highlight");
  highlight.setAttribute("fill", "rgba(0, 123, 255, 0.1)");
  highlight.setAttribute("stroke", "#007bff");
  highlight.setAttribute("stroke-width", "0.5");
  highlight.setAttribute("visibility", "hidden");

  // Setup Text
  textBox.classList.add("svg-text-box", "design-object");
  textBox.setAttribute("id", id);

  textBox.setAttribute("x", 0);
  textBox.setAttribute("y", 0);

  g.dataset.baseX = x;
  g.dataset.baseY = y;
  g.dataset.width = w;

  g.setAttribute("transform", `translate(${x}, ${y})`);

  textBox.setAttribute("font-size", `${fontSize}`);
  textBox.textContent = textContent;

  // Store originals for edit use
  textBox.dataset.baseX = x;
  textBox.dataset.baseY = y;
  textBox.dataset.width = w;

  // Set elementType so removeElement can update stats correctly
  g.setAttribute("elementType", "textBox");

  g.appendChild(highlight);
  g.appendChild(textBox);
  captureSnapshot(); // BEFORE the insert — undo must restore the prior state
  getActiveContentLayer().appendChild(g);

  // Focus Events
  g.addEventListener("focus", () => {
    const bbox = textBox.getBBox();
    highlight.setAttribute("x", bbox.x - 1);
    highlight.setAttribute("y", bbox.y - 1);
    highlight.setAttribute("width", bbox.width + 2);
    highlight.setAttribute("height", bbox.height + 2);
    highlight.setAttribute("visibility", "visible");
  });

  g.addEventListener("blur", () => {
    highlight.setAttribute("visibility", "hidden");
    addSvgTextGrip(g); // re-sync grip position after an edit may resize the text
  });

  wrapSvgText(textBox, w);
  enableBoxInteractions(g, "textBox");
  addSvgTextGrip(g); // §12 draggable grip holder bar
  modifyStats("textBox", "add");
  updateElementCounters();
};

/* ===========================
   TEXT GRIP HANDLE (§12)
=========================== */

/**
 * Adds a table-style grip "holder" bar above a text block so the whole block
 * can be grabbed and moved easily (text glyphs alone are a poor drag target).
 * Idempotent — removes any stale grip first. Uses class "svg-table-grip" so it
 * is already excluded from every export pipeline.
 */
const addSvgTextGrip = (group) => {
  group.querySelectorAll(".svg-table-grip").forEach((h) => h.remove());
  const textEl = group.querySelector("text");
  if (!textEl) return;

  let bb;
  try { bb = textEl.getBBox(); } catch (_) { return; }
  if (!bb || bb.width === 0) return;

  const GH = GRIP_H;
  const GW = Math.min(Math.max(bb.width, 10), GRIP_W_MAX);
  const cx = bb.x + bb.width / 2;
  const topY = bb.y;

  const bg = document.createElementNS(SVG_NS, "rect");
  bg.setAttribute("x",      cx - GW / 2);
  bg.setAttribute("y",      topY - GH - 1);
  bg.setAttribute("width",  GW);
  bg.setAttribute("height", GH);
  bg.setAttribute("rx",     "1.2");
  bg.setAttribute("fill",   "#0d6efd");
  bg.setAttribute("opacity","0.8");
  bg.setAttribute("class",  "svg-table-grip");
  bg.style.cursor = "grab";
  group.appendChild(bg);

  for (let i = 0; i < 3; i++) {
    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("cx",   cx - 2.5 + i * 2.5);
    dot.setAttribute("cy",   topY - GH / 2 - 1);
    dot.setAttribute("r",    GRIP_DOT_R);
    dot.setAttribute("fill", "#ffffff");
    dot.setAttribute("class","svg-table-grip");
    dot.style.cursor = "grab";
    group.appendChild(dot);
  }
};

/* ===========================
   ADD TABLE BOX
=========================== */

const addTableBox = (
  x = 20,
  y = 20,
  rows = 3,
  cols = 3,
  colWidth = 20,
  rowHeight = 10,
) => {
  const tableGroup = document.createElementNS(SVG_NS, "g");
  const id = crypto.randomUUID();

  tableGroup.setAttribute("id", `table-${id}`);
  tableGroup.setAttribute("transform", `translate(${x}, ${y})`);
  tableGroup.setAttribute("data-x", x);
  tableGroup.setAttribute("data-y", y);
  tableGroup.classList.add("design-object", "svg-table-group");

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellGroup = document.createElementNS(SVG_NS, "g");
      cellGroup.setAttribute(
        "transform",
        `translate(${c * colWidth}, ${r * rowHeight})`,
      );

      // The Border/Background of the cell
      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("width", colWidth);
      rect.setAttribute("height", rowHeight);
      rect.setAttribute("fill", "none");
      rect.setAttribute("stroke", "black");
      rect.setAttribute("stroke-width", "0.2");

      // The Text inside the cell
      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", 2);
      text.setAttribute("y", rowHeight / 1.5);
      text.setAttribute("font-size", "3");
      text.setAttribute("id", `table-${id}-R${r + 1}C${c + 1}`);
      text.textContent = `R${r + 1}C${c + 1}`;
      text.classList.add("cell-text");

      cellGroup.appendChild(rect);
      cellGroup.appendChild(text);
      tableGroup.appendChild(cellGroup);

      // Apply text wrapping to each cell
      wrapSvgText(text, colWidth - 4);
    }
  }

  // Set elementType so removeElement can update stats correctly
  tableGroup.setAttribute("elementType", "tableBox");

  captureSnapshot(); // BEFORE the insert — undo must restore the prior state
  getActiveContentLayer().appendChild(tableGroup);

  addSvgTableGrip(tableGroup, cols * colWidth, rows * rowHeight);
  enableBoxInteractions(tableGroup, "tableBox");
  modifyStats("tableBox", "add");
  updateElementCounters();
};

const updateTableDimensions = (tableId) => {
  let tableGroup = document.getElementById(tableId);
  if (!tableGroup) return;

  // Position in mm straight from the translate() transform — SVG user units
  // are mm here. (getCTM() returned screen-space values that included the
  // zoom scale, so limits were wrong at any zoom other than 100%.)
  const tMatch = (tableGroup.getAttribute("transform") || "")
    .match(/translate\(\s*([\d.+-]+)[,\s]+([\d.+-]+)\s*\)/);
  const currentX = tMatch ? parseFloat(tMatch[1]) : 0;
  const currentY = tMatch ? parseFloat(tMatch[2]) : 0;

  let newRows = parseInt(document.getElementById(`${tableId}-tableRow`).value, 10) || 1;
  let newCols = parseInt(document.getElementById(`${tableId}-tableColumn`).value, 10) || 1;

  // Preserve the table's EXISTING cell geometry instead of resetting every
  // table to the 20×10 mm default on each row/column change.
  const firstRect = tableGroup.querySelector("g > rect");
  const colWidth  = (firstRect && parseFloat(firstRect.getAttribute("width")))  || 20;
  const rowHeight = (firstRect && parseFloat(firstRect.getAttribute("height"))) || 10;

  const pageWmm = parseFloat(document.getElementById("xSize").innerText);
  const pageHmm = parseFloat(document.getElementById("ySize").innerText);
  const SAFE_MARGIN = 10;
  let colTotalWidth  = pageWmm - SAFE_MARGIN - currentX;
  let colTotalHeight = pageHmm - SAFE_MARGIN - currentY;

  let maxColumns = Math.floor(colTotalWidth / colWidth);
  let maxRows    = Math.floor(colTotalHeight / rowHeight);

  if (newRows > maxRows) {
    showToast(`Max of ${maxRows} rows supported`, "danger");
    return;
  }
  if (newCols > maxColumns) {
    showToast(`Max of ${maxColumns} cols supported`, "danger");
    return;
  }

  captureSnapshot(); // resize is destructive — allow undo

  // Preserve existing cell text so resizing doesn't wipe user content
  const oldCellText = {};
  tableGroup.querySelectorAll("text.cell-text").forEach((t) => {
    const m = t.id.match(/R(\d+)C(\d+)$/);
    if (m) oldCellText[`${m[1]}-${m[2]}`] = t.textContent;
  });

  // Clear current cells
  tableGroup.replaceChildren();

  let totalWidth = newCols * colWidth;
  let totalHeight = newRows * rowHeight;

  // Redraw cells with new dimensions
  for (let r = 0; r < newRows; r++) {
    for (let c = 0; c < newCols; c++) {
      let cellGroup = document.createElementNS(SVG_NS, "g");
      cellGroup.setAttribute(
        "transform",
        `translate(${c * colWidth}, ${r * rowHeight})`,
      );

      let rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("width", colWidth);
      rect.setAttribute("height", rowHeight);
      rect.setAttribute("fill", "none");
      rect.setAttribute("stroke", "black");
      rect.setAttribute("stroke-width", "0.2");

      let text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", 2);
      text.setAttribute("y", rowHeight / 1.5);
      text.setAttribute("font-size", "3");
      // Cell id + class are required by the context-menu cell editor —
      // without them, editing breaks after any row/column change.
      text.setAttribute("id", `${tableId}-R${r + 1}C${c + 1}`);
      text.classList.add("cell-text");
      text.textContent = oldCellText[`${r + 1}-${c + 1}`] || `R${r + 1}C${c + 1}`;

      cellGroup.appendChild(rect);
      cellGroup.appendChild(text);
      tableGroup.appendChild(cellGroup);
    }
  }

  // Re-add the drag grip (replaceChildren removed it)
  addSvgTableGrip(tableGroup, totalWidth, totalHeight);
};

/* ===========================
   ADD IMAGE BOX
=========================== */

const getImageUrl = (file) => {
  // Returns a Promise<base64 data URL> so that images survive IndexedDB round-trips.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

function triggerImageBox() {
  document.getElementById("imageInput").click();
}

// Attach Image Event Listener when DOM is loaded:
document.addEventListener("DOMContentLoaded", () => {
  const imageInput = document.getElementById("imageInput");

  if (imageInput) {
    imageInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Use base64 data URL so the image survives page reloads and IndexedDB round-trips
      const imageURL = await getImageUrl(file);

      // Detect natural image dimensions before placing on canvas
      const img = new Image();
      img.onload = () => {
        // Scale down to fit within 150mm max width, preserving aspect ratio
        const maxW = 150;
        let imageWidth = Math.min(img.naturalWidth * 0.264583, maxW); // px → mm (96dpi)
        let imageHeight = (imageWidth / img.naturalWidth) * img.naturalHeight;
        addImageBox(imageURL, imageWidth, imageHeight);
      };
      img.onerror = () => addImageBox(imageURL, 100, 100);
      img.src = imageURL;

      e.target.value = "";
    });
  }
});

const addImageBox = (src, imageWidth, imageHeight, safeMarginMm = 10) => {
  const startX = safeMarginMm + 5;
  const startY = safeMarginMm + 5;
  const id = crypto.randomUUID();

  // Wrap in a <g> so the image, handles, and drag translate all live together
  const g = document.createElementNS(SVG_NS, "g");
  g.setAttribute("id", `img-group-${id}`);
  g.setAttribute("transform", `translate(${startX}, ${startY})`);
  g.setAttribute("elementType", "imageBox");
  g.classList.add("design-object", "svg-image-group");

  const imageBox = document.createElementNS(SVG_NS, "image");
  imageBox.setAttribute("href", src);
  imageBox.setAttribute("id", id);
  imageBox.classList.add("image-box");
  imageBox.setAttribute("x", 0);
  imageBox.setAttribute("y", 0);
  imageBox.setAttribute("width", `${imageWidth}`);
  imageBox.setAttribute("height", `${imageHeight}`);
  imageBox.setAttribute("preserveAspectRatio", "xMidYMid meet");

  g.appendChild(imageBox);

  captureSnapshot(); // BEFORE the insert — undo must restore the prior state
  getActiveContentLayer().appendChild(g);

  enableBoxInteractions(g, "imageBox");
  addSvgResizeHandles(g);
  modifyStats("imageBox", "add");
  updateElementCounters();
};

/* ===========================
   SVG RESIZE HANDLES
=========================== */

/**
 * Adds 4 corner resize handles (SVG rects) inside the image group.
 * Safe to call multiple times — removes stale handles first (idempotent).
 */
const addSvgResizeHandles = (group) => {
  const imageEl = group.querySelector("image");
  if (!imageEl) return;

  // Remove any stale handles + grip before adding fresh ones
  group.querySelectorAll(".img-resize-handle").forEach((h) => h.remove());
  group.querySelectorAll(".svg-table-grip").forEach((h) => h.remove());

  const HS = 3; // handle square size in mm

  const makeHandle = (cursor) => {
    const r = document.createElementNS(SVG_NS, "rect");
    r.setAttribute("width", HS);
    r.setAttribute("height", HS);
    r.setAttribute("fill", "#007bff");
    r.setAttribute("stroke", "#fff");
    r.setAttribute("stroke-width", "0.4");
    r.setAttribute("rx", "0.5");
    r.setAttribute("opacity", "0.85");
    r.classList.add("img-resize-handle");
    r.style.cursor = cursor;
    return r;
  };

  // §5 Faint dashed border connecting the 4 corner squares (drawn behind them)
  const border = document.createElementNS(SVG_NS, "rect");
  border.setAttribute("fill",             "none");
  border.setAttribute("stroke",           "#0d6efd");
  border.setAttribute("stroke-width",     "0.75");
  border.setAttribute("stroke-dasharray", "2 1.5");
  border.setAttribute("vector-effect",    "non-scaling-stroke"); // sleek ~0.75px at any zoom
  border.setAttribute("opacity",          "0.7");
  border.setAttribute("pointer-events",   "none");
  border.classList.add("img-resize-handle");
  group.appendChild(border);

  const nwHandle = makeHandle("nw-resize");
  const neHandle = makeHandle("ne-resize");
  const seHandle = makeHandle("se-resize");
  const swHandle = makeHandle("sw-resize");

  [nwHandle, neHandle, seHandle, swHandle].forEach((h) => group.appendChild(h));

  // §13 Grip "holder" bar at the top (covers images, QR, barcode & brandkit logo)
  const gripBg = document.createElementNS(SVG_NS, "rect");
  gripBg.setAttribute("height", GRIP_H);
  gripBg.setAttribute("rx",     "1.2");
  gripBg.setAttribute("fill",   "#0d6efd");
  gripBg.setAttribute("opacity","0.8");
  gripBg.classList.add("svg-table-grip");
  gripBg.style.cursor = "grab";
  group.appendChild(gripBg);
  const gripDots = [];
  for (let i = 0; i < 3; i++) {
    const d = document.createElementNS(SVG_NS, "circle");
    d.setAttribute("r", GRIP_DOT_R);
    d.setAttribute("fill", "#ffffff");
    d.classList.add("svg-table-grip");
    d.style.cursor = "grab";
    gripDots.push(d);
    group.appendChild(d);
  }

  const positionHandles = () => {
    const w = parseFloat(imageEl.getAttribute("width")) || 0;
    const h = parseFloat(imageEl.getAttribute("height")) || 0;
    const half = HS / 2;
    nwHandle.setAttribute("x", -half);    nwHandle.setAttribute("y", -half);
    neHandle.setAttribute("x", w - half); neHandle.setAttribute("y", -half);
    seHandle.setAttribute("x", w - half); seHandle.setAttribute("y", h - half);
    swHandle.setAttribute("x", -half);    swHandle.setAttribute("y", h - half);
    border.setAttribute("x", 0); border.setAttribute("y", 0);
    border.setAttribute("width", w); border.setAttribute("height", h);
    // grip centred above the top edge
    const GW = Math.min(Math.max(w, 10), GRIP_W_MAX);
    const cx = w / 2;
    gripBg.setAttribute("x", cx - GW / 2);
    gripBg.setAttribute("y", -GRIP_H - 1);
    gripBg.setAttribute("width", GW);
    gripDots.forEach((d, i) => {
      d.setAttribute("cx", cx - 2.5 + i * 2.5);
      d.setAttribute("cy", -GRIP_H / 2 - 1);
    });
  };

  positionHandles();

  const attachResizeDrag = (handle, dir) => {
    handle.addEventListener("mousedown", (e) => {
      if (group.classList.contains("locked")) return;
      e.stopPropagation();
      e.preventDefault();

      const svg = group.ownerSVGElement;
      const toSVG = (cx, cy) => {
        const pt = svg.createSVGPoint();
        pt.x = cx; pt.y = cy;
        return pt.matrixTransform(svg.getScreenCTM().inverse());
      };

      const startSVG  = toSVG(e.clientX, e.clientY);
      const startW    = parseFloat(imageEl.getAttribute("width"))  || 0;
      const startH    = parseFloat(imageEl.getAttribute("height")) || 0;
      const tMatch    = (group.getAttribute("transform") || "").match(/translate\(\s*([\d.+-]+)[,\s]+([\d.+-]+)\s*\)/);
      const startTx   = tMatch ? parseFloat(tMatch[1]) : 0;
      const startTy   = tMatch ? parseFloat(tMatch[2]) : 0;
      const MIN       = 10; // minimum dimension in mm

      // Serialise pre-resize state now; push it only if a resize happens
      // (a plain click on a handle must not pollute the undo stack).
      const preState = _currentAllPagesSnapshot();
      let undoPushed = false;

      const onMove = (ev) => {
        if (!undoPushed) {
          undoPushed = true;
          _pushUndoSnapshot(preState);
        }
        const cur  = toSVG(ev.clientX, ev.clientY);
        const dx   = cur.x - startSVG.x;
        const dy   = cur.y - startSVG.y;
        let newW = startW, newH = startH, newTx = startTx, newTy = startTy;

        switch (dir) {
          case "se": newW = Math.max(MIN, startW + dx); newH = Math.max(MIN, startH + dy); break;
          case "ne": newW = Math.max(MIN, startW + dx); newH = Math.max(MIN, startH - dy); newTy = startTy + (startH - newH); break;
          case "nw": newW = Math.max(MIN, startW - dx); newH = Math.max(MIN, startH - dy); newTx = startTx + (startW - newW); newTy = startTy + (startH - newH); break;
          case "sw": newW = Math.max(MIN, startW - dx); newH = Math.max(MIN, startH + dy); newTx = startTx + (startW - newW); break;
        }

        imageEl.setAttribute("width",  newW.toFixed(2));
        imageEl.setAttribute("height", newH.toFixed(2));
        group.setAttribute("transform", `translate(${newTx.toFixed(2)}, ${newTy.toFixed(2)})`);
        positionHandles();
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup",   onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup",   onUp);
    });
  };

  attachResizeDrag(nwHandle, "nw");
  attachResizeDrag(neHandle, "ne");
  attachResizeDrag(seHandle, "se");
  attachResizeDrag(swHandle, "sw");
};

/* ===========================
   ADD SHAPE BOX (§6)
=========================== */

/**
 * addShapeBox — creates a rect / line / ellipse wrapped in a <g> group,
 * exactly mirroring addTextBox: snapshot BEFORE, captureSnapshot() first,
 * then append, then enableBoxInteractions.
 *
 * @param {string} kind    — "rect" | "line" | "ellipse"
 * @param {number} x       — translate x in mm
 * @param {number} y       — translate y in mm
 * @param {number} w       — width in mm
 * @param {number} h       — height in mm
 */
const addShapeBox = (kind = "rect", x = 20, y = 40, w = 40, h = 20) => {
  const g = document.createElementNS(SVG_NS, "g");
  const id = crypto.randomUUID();

  g.setAttribute("id", `shape-${id}`);
  g.setAttribute("tabindex", "0");
  g.setAttribute("transform", `translate(${x}, ${y})`);
  g.setAttribute("elementType", "shapeBox");
  g.classList.add("svg-shape-group", "design-object");

  let shape;
  if (kind === "line") {
    shape = document.createElementNS(SVG_NS, "line");
    shape.setAttribute("x1", "0");
    shape.setAttribute("y1", "0");
    shape.setAttribute("x2", w);
    shape.setAttribute("y2", "0");
  } else if (kind === "ellipse") {
    shape = document.createElementNS(SVG_NS, "ellipse");
    shape.setAttribute("cx", w / 2);
    shape.setAttribute("cy", h / 2);
    shape.setAttribute("rx", w / 2);
    shape.setAttribute("ry", h / 2);
  } else {
    // default: rect
    shape = document.createElementNS(SVG_NS, "rect");
    shape.setAttribute("x", "0");
    shape.setAttribute("y", "0");
    shape.setAttribute("width",  w);
    shape.setAttribute("height", h);
    shape.setAttribute("rx", "0");
  }

  shape.setAttribute("fill",         "none");
  shape.setAttribute("stroke",       "#000000");
  shape.setAttribute("stroke-width", "0.5");

  // §4 Right-click / drag from INSIDE the shape: rect & ellipse capture pointer
  // events across their whole area even when fill is "none". (A line has no
  // interior — it is grabbed via the top grip bar instead, like a table.)
  if (kind !== "line") shape.setAttribute("pointer-events", "all");

  g.dataset.shapeKind = kind;
  g.dataset.shapeW    = w;
  g.dataset.shapeH    = h;

  g.appendChild(shape);

  captureSnapshot(); // BEFORE insert — undo contract
  getActiveContentLayer().appendChild(g);

  enableBoxInteractions(g, "shapeBox");
  addSvgShapeHandles(g);
  modifyStats("shapeBox", "add");
  updateElementCounters();
};

/* Shape property mutators (called from context menu) */

const changeShapeStroke = (groupId, color) => {
  captureSnapshot();
  const g = document.getElementById(groupId);
  if (!g) return;
  const shape = g.querySelector("rect, ellipse, line");
  if (shape) shape.setAttribute("stroke", color);
};

const changeShapeFill = (groupId, color) => {
  captureSnapshot();
  const g = document.getElementById(groupId);
  if (!g) return;
  const shape = g.querySelector("rect, ellipse, line");
  if (shape) shape.setAttribute("fill", color === "none" ? "none" : color);
};

const changeShapeStrokeWidth = (groupId, widthMm) => {
  captureSnapshot();
  const g = document.getElementById(groupId);
  if (!g) return;
  const shape = g.querySelector("rect, ellipse, line");
  if (shape) shape.setAttribute("stroke-width", widthMm);
};

const changeShapeCornerRadius = (groupId, rx) => {
  captureSnapshot();
  const g = document.getElementById(groupId);
  if (!g) return;
  const rect = g.querySelector("rect");
  if (rect) rect.setAttribute("rx", rx);
};

const changeShapeRotation = (groupId, angleDeg) => {
  captureSnapshot();
  const g = document.getElementById(groupId);
  if (!g) return;
  const tMatch = (g.getAttribute("transform") || "").match(/translate\(\s*([\d.+-]+)[,\s]+([\d.+-]+)\s*\)/);
  const tx = tMatch ? parseFloat(tMatch[1]) : 0;
  const ty = tMatch ? parseFloat(tMatch[2]) : 0;
  let bbox;
  try { bbox = g.getBBox(); } catch (_) { bbox = { x: 0, y: 0, width: 20, height: 10 }; }
  const cx = bbox.width  / 2;
  const cy = bbox.height / 2;
  g.setAttribute("transform", `translate(${tx}, ${ty}) rotate(${angleDeg}, ${cx}, ${cy})`);
  g.dataset.shapeAngle = angleDeg;
};

/* ===========================
   SHAPE RESIZE HANDLES
=========================== */

/**
 * Adds corner resize handles to a shape group.
 * For rect/ellipse: 4 corner handles (NW, NE, SE, SW).
 * For line: 2 endpoint handles (start, end).
 * Safe to call multiple times — removes stale handles first.
 */
const addSvgShapeHandles = (group) => {
  group.querySelectorAll(".img-resize-handle").forEach((h) => h.remove());
  group.querySelectorAll(".svg-table-grip").forEach((h) => h.remove());

  const kind = group.dataset.shapeKind || "rect";
  const HS   = 3; // handle size in mm

  const makeHandle = (cursor) => {
    const r = document.createElementNS(SVG_NS, "rect");
    r.setAttribute("width",  HS);
    r.setAttribute("height", HS);
    r.setAttribute("fill",   "#fd7e14");
    r.setAttribute("stroke", "#fff");
    r.setAttribute("stroke-width", "0.4");
    r.setAttribute("rx", "0.5");
    r.setAttribute("opacity", "0.9");
    r.classList.add("img-resize-handle");
    r.style.cursor = cursor;
    return r;
  };

  // §5 Faint dashed border connecting the corner handles (easier to see the box)
  const makeBorder = () => {
    const r = document.createElementNS(SVG_NS, "rect");
    r.setAttribute("fill",             "none");
    r.setAttribute("stroke",           "#0d6efd");
    r.setAttribute("stroke-width",     "0.75");
    r.setAttribute("stroke-dasharray", "2 1.5");
    r.setAttribute("vector-effect",    "non-scaling-stroke"); // sleek ~0.75px at any zoom
    r.setAttribute("opacity",          "0.7");
    r.setAttribute("pointer-events",   "none");
    r.classList.add("img-resize-handle"); // chrome class → excluded from exports
    return r;
  };

  // §2 Table-style grip "holder" at the top — easy to grab and move the shape.
  const makeGrip = () => {
    const GH = GRIP_H; // slim (§13)
    const bg = document.createElementNS(SVG_NS, "rect");
    bg.setAttribute("height", GH);
    bg.setAttribute("rx",     "1.2");
    bg.setAttribute("fill",   "#fd7e14");
    bg.setAttribute("opacity","0.85");
    bg.classList.add("svg-table-grip"); // chrome class → excluded from exports
    bg.style.cursor = "grab";
    const dots = [];
    for (let i = 0; i < 3; i++) {
      const d = document.createElementNS(SVG_NS, "circle");
      d.setAttribute("r", GRIP_DOT_R);
      d.setAttribute("fill", "#ffffff");
      d.classList.add("svg-table-grip");
      d.style.cursor = "grab";
      dots.push(d);
    }
    return { bg, dots, GH };
  };

  // Position the grip pill + dots at the top-centre of a w-wide box whose top
  // edge sits at local y = topY, horizontally centred on cx.
  const positionGrip = (grip, cx, topY, w) => {
    const GW = Math.min(Math.max(w, 10), GRIP_W_MAX);
    grip.bg.setAttribute("x",     cx - GW / 2);
    grip.bg.setAttribute("y",     topY - grip.GH - 1);
    grip.bg.setAttribute("width", GW);
    grip.dots.forEach((d, i) => {
      d.setAttribute("cx", cx - 2.5 + i * 2.5);
      d.setAttribute("cy", topY - grip.GH / 2 - 1);
    });
  };

  const svg = group.ownerSVGElement;
  const toSVG = (cx, cy) => {
    const pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  if (kind === "line") {
    const lineEl = group.querySelector("line");
    if (!lineEl) return;

    const startHandle = makeHandle("crosshair");
    const endHandle   = makeHandle("crosshair");
    group.appendChild(startHandle);
    group.appendChild(endHandle);

    // §2/§4 Grip bar above the line — the line has no interior to grab/right-click.
    const grip = makeGrip();
    group.appendChild(grip.bg);
    grip.dots.forEach((d) => group.appendChild(d));

    const positionLineHandles = () => {
      const x1 = parseFloat(lineEl.getAttribute("x1")) || 0;
      const y1 = parseFloat(lineEl.getAttribute("y1")) || 0;
      const x2 = parseFloat(lineEl.getAttribute("x2")) || 0;
      const y2 = parseFloat(lineEl.getAttribute("y2")) || 0;
      const half = HS / 2;
      startHandle.setAttribute("x", x1 - half);
      startHandle.setAttribute("y", y1 - half);
      endHandle.setAttribute("x",   x2 - half);
      endHandle.setAttribute("y",   y2 - half);
      const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
      positionGrip(grip, (minX + maxX) / 2, Math.min(y1, y2), maxX - minX);
    };
    positionLineHandles();

    const attachLineDrag = (handle, isEnd) => {
      handle.addEventListener("mousedown", (e) => {
        if (group.classList.contains("locked")) return;
        e.stopPropagation();
        e.preventDefault();
        const preState  = _currentAllPagesSnapshot();
        let undoPushed  = false;
        const onMove = (ev) => {
          if (!undoPushed) { _pushUndoSnapshot(preState); undoPushed = true; }
          const svgPt = toSVG(ev.clientX, ev.clientY);
          const tMatch = (group.getAttribute("transform") || "").match(/translate\(\s*([\d.+-]+)[,\s]+([\d.+-]+)\s*\)/);
          const tx = tMatch ? parseFloat(tMatch[1]) : 0;
          const ty = tMatch ? parseFloat(tMatch[2]) : 0;
          const lx = svgPt.x - tx;
          const ly = svgPt.y - ty;
          if (isEnd) {
            lineEl.setAttribute("x2", lx);
            lineEl.setAttribute("y2", ly);
            group.dataset.shapeW = Math.abs(lx - parseFloat(lineEl.getAttribute("x1") || 0));
          } else {
            lineEl.setAttribute("x1", lx);
            lineEl.setAttribute("y1", ly);
          }
          positionLineHandles();
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup",   onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup",   onUp);
      });
    };
    attachLineDrag(startHandle, false);
    attachLineDrag(endHandle,   true);

  } else {
    // rect or ellipse — 4 corner handles
    const shapeEl = group.querySelector("rect, ellipse");
    if (!shapeEl) return;

    // §5 Faint border first (drawn behind handles), then the 4 corner handles.
    const border = makeBorder();
    group.appendChild(border);

    const nwHandle = makeHandle("nw-resize");
    const neHandle = makeHandle("ne-resize");
    const seHandle = makeHandle("se-resize");
    const swHandle = makeHandle("sw-resize");
    [nwHandle, neHandle, seHandle, swHandle].forEach((h) => group.appendChild(h));

    // §2 Grip "holder" at the top-centre for easy grabbing.
    const grip = makeGrip();
    group.appendChild(grip.bg);
    grip.dots.forEach((d) => group.appendChild(d));

    const getWH = () => {
      if (shapeEl.tagName === "ellipse") {
        return {
          w: parseFloat(shapeEl.getAttribute("rx") || 0) * 2,
          h: parseFloat(shapeEl.getAttribute("ry") || 0) * 2,
        };
      }
      return {
        w: parseFloat(shapeEl.getAttribute("width")  || 0),
        h: parseFloat(shapeEl.getAttribute("height") || 0),
      };
    };

    const positionHandles = () => {
      const { w, h } = getWH();
      const half = HS / 2;
      nwHandle.setAttribute("x", -half);    nwHandle.setAttribute("y", -half);
      neHandle.setAttribute("x", w - half); neHandle.setAttribute("y", -half);
      seHandle.setAttribute("x", w - half); seHandle.setAttribute("y", h - half);
      swHandle.setAttribute("x", -half);    swHandle.setAttribute("y", h - half);
      // §5 border spans the box; §2 grip sits above the top edge
      border.setAttribute("x", 0); border.setAttribute("y", 0);
      border.setAttribute("width", w); border.setAttribute("height", h);
      positionGrip(grip, w / 2, 0, w);
    };
    positionHandles();

    const setWH = (w, h) => {
      if (shapeEl.tagName === "ellipse") {
        shapeEl.setAttribute("rx", w / 2);
        shapeEl.setAttribute("ry", h / 2);
        shapeEl.setAttribute("cx", w / 2);
        shapeEl.setAttribute("cy", h / 2);
      } else {
        shapeEl.setAttribute("width",  w);
        shapeEl.setAttribute("height", h);
      }
      group.dataset.shapeW = w;
      group.dataset.shapeH = h;
    };

    const attachResizeDrag = (handle, dir) => {
      handle.addEventListener("mousedown", (e) => {
        if (group.classList.contains("locked")) return;
        e.stopPropagation();
        e.preventDefault();
        const startSVG  = toSVG(e.clientX, e.clientY);
        const { w: startW, h: startH } = getWH();
        const tMatch    = (group.getAttribute("transform") || "").match(/translate\(\s*([\d.+-]+)[,\s]+([\d.+-]+)\s*\)/);
        const startTx   = tMatch ? parseFloat(tMatch[1]) : 0;
        const startTy   = tMatch ? parseFloat(tMatch[2]) : 0;
        const MIN       = 5;
        const preState  = _currentAllPagesSnapshot();
        let undoPushed  = false;

        const onMove = (ev) => {
          if (!undoPushed) { _pushUndoSnapshot(preState); undoPushed = true; }
          const cur   = toSVG(ev.clientX, ev.clientY);
          const dx    = cur.x - startSVG.x;
          const dy    = cur.y - startSVG.y;
          let newW    = startW;
          let newH    = startH;
          let newTx   = startTx;
          let newTy   = startTy;

          if (dir === "se") { newW = Math.max(MIN, startW + dx); newH = Math.max(MIN, startH + dy); }
          if (dir === "sw") { newW = Math.max(MIN, startW - dx); newH = Math.max(MIN, startH + dy); newTx = startTx + startW - newW; }
          if (dir === "ne") { newW = Math.max(MIN, startW + dx); newH = Math.max(MIN, startH - dy); newTy = startTy + startH - newH; }
          if (dir === "nw") { newW = Math.max(MIN, startW - dx); newH = Math.max(MIN, startH - dy); newTx = startTx + startW - newW; newTy = startTy + startH - newH; }

          group.setAttribute("transform", `translate(${newTx}, ${newTy})`);
          setWH(newW, newH);
          positionHandles();
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup",   onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup",   onUp);
      });
    };

    attachResizeDrag(nwHandle, "nw");
    attachResizeDrag(neHandle, "ne");
    attachResizeDrag(seHandle, "se");
    attachResizeDrag(swHandle, "sw");
  }
};

/* ===========================
   TABLE GRIP HANDLE
=========================== */

/**
 * Adds a visible drag-grip indicator at the top of a table group.
 * Safe to call multiple times — removes stale grip first (idempotent).
 */
const addSvgTableGrip = (group, tableWidth = 60, tableHeight = 30) => {
  group.querySelectorAll(".svg-table-grip").forEach((h) => h.remove());

  const GW = Math.min(tableWidth, GRIP_W_MAX); // grip width capped
  const GH = GRIP_H;                           // slim grip height (§13)

  // Background pill
  const bg = document.createElementNS(SVG_NS, "rect");
  bg.setAttribute("x",      (tableWidth / 2) - (GW / 2));
  bg.setAttribute("y",      -GH - 1);
  bg.setAttribute("width",  GW);
  bg.setAttribute("height", GH);
  bg.setAttribute("rx",     "1.2");
  bg.setAttribute("fill",   "#0d6efd");
  bg.setAttribute("opacity","0.8");
  bg.setAttribute("class",  "svg-table-grip");
  bg.style.cursor = "grab";

  // Pill first, dots after — SVG paints in document order, so appending the
  // pill last would cover the white dots.
  group.appendChild(bg);

  // Dotted lines to indicate grip
  for (let i = 0; i < 3; i++) {
    const dot = document.createElementNS(SVG_NS, "circle");
    const cx = (tableWidth / 2) - 2.5 + (i * 2.5);
    dot.setAttribute("cx",     cx);
    dot.setAttribute("cy",     -GH / 2 - 1);
    dot.setAttribute("r",      GRIP_DOT_R);
    dot.setAttribute("fill",   "#ffffff");
    dot.setAttribute("class",  "svg-table-grip");
    dot.style.cursor = "grab";
    group.appendChild(dot);
  }
};
