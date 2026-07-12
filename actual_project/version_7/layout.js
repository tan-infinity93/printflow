/*
  layout.js — canvas layout, rulers, grid, safe zone, multi-page management.
*/

const SVG_NS = "http://www.w3.org/2000/svg";
const RULER_SIZE_MM = 10;      // ruler gutter thickness
const PAGE_GAP_MM   = 15;      // vertical gap between pages
const MAX_PAGES     = 5;

// ---- page management helpers ------------------------------------------------

const getActivePage = () =>
  parseInt(window.sessionStorage.getItem("currentPage")) || 1;

const getTotalPages = () =>
  parseInt(window.sessionStorage.getItem("totalPages")) || 1;

const getActiveContentLayer = () =>
  document.getElementById(`content-layer-${getActivePage()}`);

const getAllContentLayers = () => {
  const total = getTotalPages();
  const out = [];
  for (let p = 1; p <= total; p++) {
    const layer = document.getElementById(`content-layer-${p}`);
    if (layer) out.push({ pageNo: p, layer });
  }
  return out;
};

/** Visually mark a page as active (highlighted border). */
const setActivePage = (pageNo) => {
  const total = getTotalPages();
  for (let p = 1; p <= total; p++) {
    const pg = document.getElementById(`pageGroup-${p}`);
    if (!pg) continue;
    // No visual border highlight — just track active page silently
    if (p === pageNo) pg.classList.add("active-page");
    else pg.classList.remove("active-page");

    // "Active" watermark badge (top-left, mirrors the page-number badge).
    // Toggled via display (not visibility) so preview/export visibility
    // restores never reveal it on inactive pages.
    const badge = document.getElementById(`page-active-badge-${p}`);
    if (badge) badge.style.display = p === pageNo ? "block" : "none";
  }
  window.sessionStorage.setItem("currentPage", pageNo);
  const badge = document.getElementById("currentPageBadge");
  if (badge) badge.textContent = `${pageNo} / ${total}`;
};

// ---- geometry helpers -------------------------------------------------------

const getPageOffsetY = (pageNo, pageHeight) =>
  RULER_SIZE_MM + (pageNo - 1) * (pageHeight + PAGE_GAP_MM);

const totalSvgHeight = (pageHeight, totalPages) =>
  RULER_SIZE_MM + totalPages * pageHeight + (totalPages - 1) * PAGE_GAP_MM;

// ---- SVG size ---------------------------------------------------------------

const updateSvgSize = (width, height, totalPages) => {
  const svgRoot = document.getElementById("workspace");
  const totalH  = totalSvgHeight(height, totalPages);
  const svgW    = width  + RULER_SIZE_MM + 5;
  const svgH    = totalH + 5;
  svgRoot.setAttribute("width",   `${svgW}mm`);
  svgRoot.setAttribute("height",  `${svgH}mm`);
  svgRoot.setAttribute("viewBox", `0 0 ${svgW} ${svgH}`);
  updateCanvasSize(svgW, svgH);
};

/**
 * Keeps the #canvas div exactly the same size as the SVG so the grey
 * background never bleeds beyond the page area when the format changes.
 * Called every time the SVG dimensions change.
 */
const updateCanvasSize = (svgWmm, svgHmm) => {
  const canvasEl = document.getElementById("canvas");
  if (!canvasEl) return;
  canvasEl.style.width  = `${svgWmm}mm`;
  canvasEl.style.height = `${svgHmm}mm`;
};

// ---- Settings tab resize fix -----------------------------------------------

document
  .querySelectorAll('#settingsModal a[data-bs-toggle="tab"]')
  .forEach((tabEl) => {
    tabEl.addEventListener("shown.bs.tab", function () {
      const modalContent = document.querySelector(
        "#settingsModal .modal-content",
      );
      const currentHeight = modalContent.offsetHeight;
      modalContent.style.height = currentHeight + "px";
      modalContent.offsetHeight; // force reflow
      const newHeight = modalContent.scrollHeight;
      modalContent.style.height = newHeight + "px";
      setTimeout(() => { modalContent.style.height = "auto"; }, 400);
    });
  });

// ---- Grid -------------------------------------------------------------------

const setGridSize = (gridSize) => {
  const pageSize = window.sessionStorage.getItem("pageSize");
  const { width, height } = pageDimensions[pageSize];
  const svgRoot = document.getElementById("workspace");
  window.sessionStorage.setItem("gridSize", `${gridSize}`);
  const total = getTotalPages();
  for (let p = 1; p <= total; p++) {
    setGridBoxes(width, height, svgRoot, p);
  }
};

/** Draws (or redraws) the grid pattern and overlay for ONE page. */
const setGridBoxes = (pageW, pageH, svgRoot, pageNo = 1) => {
  const NS       = SVG_NS;
  const gridSize = Number(sessionStorage.getItem("gridSize")) || 10;

  // Shared defs — one pattern serves all pages (same page size)
  let defs = svgRoot.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(NS, "defs");
    svgRoot.prepend(defs);
  }
  // (Re)build pattern only once — it's reused across pages
  defs.innerHTML = "";
  const pattern = document.createElementNS(NS, "pattern");
  pattern.setAttribute("id", "gridPattern");
  pattern.setAttribute("width",  gridSize);
  pattern.setAttribute("height", gridSize);
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("id", "gridPath");
  path.setAttribute("d", `M ${gridSize} 0 L 0 0 L 0 ${gridSize}`);
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "0.4");
  path.setAttribute("fill", "none");
  pattern.appendChild(path);
  defs.appendChild(pattern);

  // Per-page overlay rect
  const gridLayer = document.getElementById(`grid-layer-${pageNo}`);
  if (!gridLayer) return;

  let gridRect = gridLayer.querySelector(`#gridOverlay-${pageNo}`);
  if (!gridRect) {
    gridRect = document.createElementNS(NS, "rect");
    gridRect.setAttribute("id", `gridOverlay-${pageNo}`);
    gridLayer.appendChild(gridRect);
  }
  gridRect.setAttribute("x", 0);
  gridRect.setAttribute("y", 0);
  gridRect.setAttribute("width",  pageW);
  gridRect.setAttribute("height", pageH);
  gridRect.setAttribute("fill", "url(#gridPattern)");
  gridRect.setAttribute("pointer-events", "none");
};

// ---- Safe zone --------------------------------------------------------------

/** Creates/replaces the safe-zone rect for one page. */
const setSafeZone = (width, height, svgPage, safeMarginMm = 10, pageNo = 1) => {
  const existing = document.getElementById(`safeZone-${pageNo}`);
  if (existing) existing.remove();

  const safeZone = document.createElementNS(SVG_NS, "rect");
  safeZone.setAttribute("id",            `safeZone-${pageNo}`);
  safeZone.setAttribute("x",             safeMarginMm);
  safeZone.setAttribute("y",             safeMarginMm);
  safeZone.setAttribute("width",         width  - safeMarginMm * 2);
  safeZone.setAttribute("height",        height - safeMarginMm * 2);
  safeZone.setAttribute("fill",          "none");
  safeZone.setAttribute("stroke",        "#999");
  safeZone.setAttribute("stroke-dasharray", "0.5 0.5");
  svgPage.appendChild(safeZone);

  window.sessionStorage.setItem("marginSize", `${safeMarginMm - 10}`);
};

// ---- Rulers -----------------------------------------------------------------

/**
 * buildRulers — draws top and left rulers.
 * The LEFT ruler resets to 0 at the top of EACH page so coordinates always read
 * relative to the current page (not accumulated across pages).
 * No page-number badges in the ruler — those are watermarks on the page itself.
 */
const buildRulers = (svgRoot, pageWidthMm, pageHeightMm, rulerSizeMm = RULER_SIZE_MM) => {
  let rulerLayer = svgRoot.querySelector("#rulers-layer");
  if (!rulerLayer) {
    rulerLayer = document.createElementNS(SVG_NS, "g");
    rulerLayer.setAttribute("id", "rulers-layer");
    svgRoot.appendChild(rulerLayer);
  }
  rulerLayer.innerHTML = "";

  const total = getTotalPages();
  const tick  = (x1, y1, x2, y2) => {
    const l = document.createElementNS(SVG_NS, "line");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1);
    l.setAttribute("x2", x2); l.setAttribute("y2", y2);
    l.setAttribute("stroke", "#555"); l.setAttribute("stroke-width", "0.3");
    rulerLayer.appendChild(l);
  };
  const lbl = (x, y, text, anchor = "middle") => {
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", x); t.setAttribute("y", y);
    t.setAttribute("text-anchor", anchor);
    t.setAttribute("font-size",   "3");
    t.setAttribute("fill",        "#444");
    t.textContent = text;
    rulerLayer.appendChild(t);
  };

  // --- TOP RULER (0 → pageWidth, same for all pages) ---
  for (let x = 0; x <= pageWidthMm; x++) {
    const svgX = x + rulerSizeMm;
    tick(svgX, 0, svgX, x % 10 === 0 ? 6 : x % 5 === 0 ? 4 : 3);
    if (x % 10 === 0) lbl(svgX, rulerSizeMm - 1, x);
  }

  // --- LEFT RULER — per page, coordinates restart at 0 for each page ---
  for (let p = 1; p <= total; p++) {
    const pageOffsetY = getPageOffsetY(p, pageHeightMm);

    for (let y = 0; y <= pageHeightMm; y++) {
      const svgY = pageOffsetY + y;
      tick(0, svgY, y % 10 === 0 ? 6 : y % 5 === 0 ? 4 : 3, svgY);
      if (y % 10 === 0) lbl(rulerSizeMm - 1, svgY + 1, y, "end");
    }
  }
};

// ---- Single page group builder ---------------------------------------------

/** Creates the SVG elements for one page, optionally restoring saved content. */
const buildOnePageGroup = (svgRoot, pageNo, width, height, savedChildren = []) => {
  const offsetY = getPageOffsetY(pageNo, height);

  // Page group
  const pageGroup = document.createElementNS(SVG_NS, "g");
  pageGroup.setAttribute("id",        `pageGroup-${pageNo}`);
  pageGroup.setAttribute("class",     "page-group");
  pageGroup.setAttribute("data-page", pageNo);
  pageGroup.setAttribute("transform", `translate(${RULER_SIZE_MM}, ${offsetY})`);
  svgRoot.appendChild(pageGroup);

  // Page rect (white paper)
  const pageRect = document.createElementNS(SVG_NS, "rect");
  pageRect.setAttribute("id",           `pageRect-${pageNo}`);
  pageRect.setAttribute("class",        "pageRect");
  pageRect.setAttribute("width",        width);
  pageRect.setAttribute("height",       height);
  pageRect.setAttribute("fill",         "white");
  pageRect.setAttribute("stroke",       "#ccc");
  pageRect.setAttribute("stroke-width", "0.5");
  pageGroup.appendChild(pageRect);

  // Grid layer — visible by default
  const gridLayer = document.createElementNS(SVG_NS, "g");
  gridLayer.setAttribute("id", `grid-layer-${pageNo}`);
  gridLayer.style.display = "block";
  pageGroup.appendChild(gridLayer);

  // Safe zone placeholder (setSafeZone will fill it)
  const safeZonePlaceholder = document.createElementNS(SVG_NS, "rect");
  safeZonePlaceholder.setAttribute("id", `safeZone-${pageNo}`);
  pageGroup.appendChild(safeZonePlaceholder);

  // Content layer
  const contentLayer = document.createElementNS(SVG_NS, "g");
  contentLayer.setAttribute("id", `content-layer-${pageNo}`);
  pageGroup.appendChild(contentLayer);

  // Restore previously saved children (after page-size change)
  savedChildren.forEach((child) => contentLayer.appendChild(child));

  // Click anywhere on the page to make it active
  pageGroup.addEventListener("mousedown", (e) => {
    // Don't re-activate when clicking a resize handle (that triggers its own logic)
    if (e.target.classList && e.target.classList.contains("img-resize-handle")) return;
    setActivePage(pageNo);
  });

  // Page number badge — small, visible indicator at top-right corner, excluded from exports
  const watermark = document.createElementNS(SVG_NS, "text");
  watermark.setAttribute("id",          `page-watermark-${pageNo}`);
  watermark.setAttribute("x",           width - 3);
  watermark.setAttribute("y",           7);
  watermark.setAttribute("text-anchor", "end");
  watermark.setAttribute("font-size",   "5");
  watermark.setAttribute("fill",        "#0d6efd");
  watermark.setAttribute("opacity",     "0.35");
  watermark.setAttribute("font-weight", "bold");
  watermark.setAttribute("class",       "page-watermark");
  watermark.setAttribute("pointer-events", "none");
  watermark.textContent = `P${pageNo}`;
  pageGroup.appendChild(watermark);

  // "Active" badge — top-left counterpart of the page-number badge, shown
  // only on the currently selected page (toggled in setActivePage).
  // Carries the page-watermark class so EVERY export path already excludes
  // it: raster PDF (ignoreElements), vector PDF (stripped from clone),
  // raw SVG export (visibility-hidden during capture), and JSON/snapshots
  // (lives on the page group, never inside a content layer).
  const activeBadge = document.createElementNS(SVG_NS, "text");
  activeBadge.setAttribute("id",          `page-active-badge-${pageNo}`);
  activeBadge.setAttribute("x",           3);
  activeBadge.setAttribute("y",           7);
  activeBadge.setAttribute("text-anchor", "start");
  activeBadge.setAttribute("font-size",   "5");
  activeBadge.setAttribute("fill",        "#0d6efd");
  activeBadge.setAttribute("opacity",     "0.35");
  activeBadge.setAttribute("font-weight", "bold");
  activeBadge.setAttribute("class",       "page-watermark page-active-badge");
  activeBadge.setAttribute("pointer-events", "none");
  activeBadge.textContent = "◉ Active";
  activeBadge.style.display = "none"; // setActivePage reveals the right one
  pageGroup.appendChild(activeBadge);

  // "DRAFT" badge — top-center, shown while document is in draft status.
  // Excluded from all exports via the page-watermark class.
  const draftBadge = document.createElementNS(SVG_NS, "text");
  draftBadge.setAttribute("id",          `page-draft-badge-${pageNo}`);
  draftBadge.setAttribute("x",           width / 2);
  draftBadge.setAttribute("y",           7);
  draftBadge.setAttribute("text-anchor", "middle");
  draftBadge.setAttribute("font-size",   "5");
  draftBadge.setAttribute("fill",        "#dc3545");
  draftBadge.setAttribute("opacity",     "0.22");
  draftBadge.setAttribute("font-weight", "bold");
  draftBadge.setAttribute("class",       "page-watermark page-draft-badge");
  draftBadge.setAttribute("pointer-events", "none");
  draftBadge.textContent = "DRAFT";
  // Visible by default — approval.js hides it once status transitions to "approved"
  pageGroup.appendChild(draftBadge);

  // Initialize safe zone and grid
  setSafeZone(width, height, pageGroup, 10, pageNo);
  const svgRoot2 = document.getElementById("workspace");
  setGridBoxes(width, height, svgRoot2, pageNo);

  return pageGroup;
};

// ---- Main canvas layout ----------------------------------------------------

/**
 * layoutSvgCanvas — builds (or rebuilds) the full multi-page canvas.
 * Preserves content-layer children across page-size changes.
 */
const layoutSvgCanvas = (pageSize, callFromScript = true) => {
  const { width, height } = pageDimensions[pageSize];
  const total = getTotalPages();

  document.getElementById("xSize").textContent = `${width} mm`;
  document.getElementById("ySize").textContent = `${height} mm`;

  const svgRoot = document.getElementById("workspace");

  // --- Save content from all pages before wiping the SVG ---
  const savedContent = {};
  for (let p = 1; p <= total; p++) {
    const cl = document.getElementById(`content-layer-${p}`);
    savedContent[p] = cl ? Array.from(cl.children) : [];
  }

  // --- Wipe and resize SVG ---
  svgRoot.replaceChildren();
  updateSvgSize(width, height, total);

  // --- Rulers layer (empty shell — filled by buildRulers) ---
  const rulersLayer = document.createElementNS(SVG_NS, "g");
  rulersLayer.setAttribute("id", "rulers-layer");
  svgRoot.appendChild(rulersLayer);

  // --- Build each page group ---
  for (let p = 1; p <= total; p++) {
    buildOnePageGroup(svgRoot, p, width, height, savedContent[p] || []);
  }

  // --- Restore grid visibility (default: visible) ---
  const gridState = window.sessionStorage.getItem("gridLinesDisplay");
  const gridVisible = gridState !== "false"; // default true unless explicitly turned off
  for (let p = 1; p <= total; p++) {
    const gl = document.getElementById(`grid-layer-${p}`);
    if (gl) gl.style.display = gridVisible ? "block" : "none";
  }

  const currentPage = getActivePage();
  setActivePage(Math.min(currentPage, total));

  if (callFromScript === false) {
    buildRulers(svgRoot, width, height);
  }
};

// ---- Add / Remove page -----------------------------------------------------

/** Appends a new blank page below the existing ones (max MAX_PAGES). */
const addPage = () => {
  const total    = getTotalPages();
  if (total >= MAX_PAGES) {
    if (typeof showToast === "function") showToast(`Maximum ${MAX_PAGES} pages allowed`, "warning");
    return;
  }
  const pageSize = window.sessionStorage.getItem("pageSize") || "A4";
  const { width, height } = pageDimensions[pageSize];
  const newTotal = total + 1;

  window.sessionStorage.setItem("totalPages", newTotal);
  updateSvgSize(width, height, newTotal);

  const svgRoot = document.getElementById("workspace");
  buildOnePageGroup(svgRoot, newTotal, width, height);
  buildRulers(svgRoot, width, height);

  // Activate the new page
  setActivePage(newTotal);
  _updatePageUI();

  if (typeof showToast === "function") showToast(`Page ${newTotal} added`, "success");
};

/** Removes the LAST page (and its content) if more than 1 page exists. */
const removePage = () => {
  const total = getTotalPages();
  if (total <= 1) {
    if (typeof showToast === "function") showToast("Cannot remove the only page", "warning");
    return;
  }
  const pageSize = window.sessionStorage.getItem("pageSize") || "A4";
  const { width, height } = pageDimensions[pageSize];

  const pg = document.getElementById(`pageGroup-${total}`);
  if (pg) pg.remove();

  const newTotal = total - 1;
  window.sessionStorage.setItem("totalPages", newTotal);
  updateSvgSize(width, height, newTotal);

  // If active page was the removed one, switch to last
  const active = getActivePage();
  if (active > newTotal) setActivePage(newTotal);

  buildRulers(document.getElementById("workspace"), width, height);
  _updatePageUI();

  if (typeof showToast === "function") showToast(`Page ${total} removed`, "success");
};

/** Sync the page counter badge and Add/Remove button states in the left panel. */
const _updatePageUI = () => {
  const total  = getTotalPages();
  const active = getActivePage();

  const badge = document.getElementById("currentPageBadge");
  if (badge) badge.textContent = `${active} / ${total}`;

  const addBtn = document.getElementById("addPageBtn");
  const rmBtn  = document.getElementById("removePageBtn");
  if (addBtn) addBtn.disabled = (total >= MAX_PAGES);
  if (rmBtn)  rmBtn.disabled  = (total <= 1);
};

// ---- Left-panel section toggle ---------------------------------------------

const hideLeftHandMenuOptions = (menuName) => {
  let menuNames;
  if (menuName === "all-left-hand-side") {
    menuNames = [
      "page-setup-and-coordinates",
      "pointer-coordinates",
      "document-preset",
      "document-elements",
      "zoom-controls",
      "grid-controls",
      "safe-zone-controls",
      "print-controls",
    ];
  } else {
    menuNames = [menuName];
  }

  menuNames.forEach((name) => {
    const menuDiv = document.getElementById(name);
    if (!menuDiv) return;
    if (menuDiv.classList.contains("hidden")) {
      menuDiv.classList.remove("hidden");
      window.sessionStorage.setItem(`${name}-display`, "1");
    } else {
      menuDiv.classList.add("hidden");
      window.sessionStorage.setItem(`${name}-display`, "0");
    }
  });
};

const showRightHandSideMenu = () => {
  document.getElementById("doc-canvas").classList.remove("col-md-9");
  document.getElementById("doc-canvas").classList.add("col-md-8");
  document.getElementById("right-hand-menu").style.display = "block";
};

// ---- DPI Verification -------------------------------------------------------

const getEffectiveDpi = () => {
  const page = getActivePage();
  const pageRect = document.getElementById(`pageRect-${page}`);
  if (!pageRect) return null;

  const bRect   = pageRect.getBoundingClientRect();
  const pageSize = window.sessionStorage.getItem("pageSize") || "A4";
  const dims    = (typeof pageDimensions !== "undefined")
    ? pageDimensions[pageSize]
    : { width: 210, height: 297 };

  const pxPerMmX = bRect.width  / dims.width;
  const pxPerMmY = bRect.height / dims.height;
  return {
    dpiX: Math.round(pxPerMmX * 25.4),
    dpiY: Math.round(pxPerMmY * 25.4),
  };
};
