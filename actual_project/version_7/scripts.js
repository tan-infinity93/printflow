/* ===========================
   CONSTANTS & STATE
=========================== */

const page = document.getElementById("page");
const svgRoot = document.getElementById("workspace");
const canvas = document.getElementById("canvas");
const xVal = document.getElementById("xVal");
const yVal = document.getElementById("yVal");
const contextMenu = document.getElementById("contextMenu");
const removeBtn = document.getElementById("removeElementBtn");

let activeElement = null;
let zoomLevel = 1;
// let zoomLevel = 2;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;
const RULER_MAJOR_STEP = 10; // mm
const RULER_MINOR_STEP = 1; // mm
const PX_PER_MM = 96 / 25.4; // 3.779527559
const MIN_VERTICAL_GAP_MM = 5;

const gridSizes = [5, 10, 20];
let gridMm = 10; // default grid size in mm

// Needed for letters.js module:
const pageType = document.getElementById("pageType");
const pageTypeDropDownBtn = document.getElementById("pageTypeDropDownBtn");

/* ===========================
   PAGE DIMENSIONS (MM)
=========================== */

const pageDimensions = {
  A4: { width: 210, height: 297, fontSize: 4.0 },
  A5: { width: 148, height: 210, fontSize: 3.0 },
  C4: { width: 229, height: 324, fontSize: 4.4 },
  DL_E: { width: 220, height: 110, fontSize: 3.0 },
  C5_E: { width: 229, height: 162, fontSize: 3.0 },
  Num10_E: { width: 241, height: 105, fontSize: 3.0 },
};

// IndexedDB helper layer (initDB, saveRecordToDB, getAllRecordsFromDB,
// getSingleRecordFromDB, checkLoginUser, deleteSingleRecordFromDB) now lives
// in shared-db.js — loaded before this file in workspace.html, and on its own
// in index.html so the login page no longer loads canvas code.

/* ===========================
   ZOOM (VISUAL ONLY)
=========================== */

const applyZoom = () => {
  const canvas = document.getElementById("canvas");
  const zoomDisplay = document.getElementById("zoomLevel");

  // 1. Apply the scale to the container div
  // Using transform-origin 'top left' keeps the page aligned with your rulers
  canvas.style.transform = `scale(${zoomLevel})`;
  canvas.style.transformOrigin = "top left";

  // 2. Update the UI Badge
  const zoomPercent = Math.round(zoomLevel * 100);
  if (zoomDisplay) {
    zoomDisplay.innerHTML = `
      <span class="badge rounded-pill bg-primary">${zoomPercent} %</span>
    `;
  }
};

const zoomIn = () => {
  zoomLevel = Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP);
  applyZoom();
};

const zoomOut = () => {
  zoomLevel = Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP);
  applyZoom();
};

const resetZoom = () => {
  zoomLevel = 1;
  applyZoom();
  const pageSize = window.sessionStorage.getItem("pageSize") || "A4";
  const { width, height } = pageDimensions[pageSize];
  buildRulers(svgRoot, width, height); // rebuilds with correct total-height for all pages
};

/* ===========================
   CURSOR → MM TRACKING
=========================== */

// Changed workspace below to svgRoot:
if (svgRoot) svgRoot.addEventListener("mousemove", (e) => {
  // if (!pageGroup) return;
  // const rect = pageGroup.getBoundingClientRect();
  if (!svgRoot) return;
  const rect = svgRoot.getBoundingClientRect();

  const xPx = e.clientX - rect.left;
  const yPx = e.clientY - rect.top;

  if (xPx < 0 || yPx < 0 || xPx > rect.width || yPx > rect.height) {
    return; // outside page
  }

  const pageWidthMm = parseFloat(document.getElementById("xSize").textContent);
  const pageHeightMm = parseFloat(document.getElementById("ySize").textContent);

  const mmPerPxX = pageWidthMm / rect.width;
  const mmPerPxY = pageHeightMm / rect.height;

  const xMm = xPx * mmPerPxX;
  const yMm = yPx * mmPerPxY;

  xVal.textContent = `${xMm.toFixed(1)} mm`;
  yVal.textContent = `${yMm.toFixed(1)} mm`;
});

/* ===========================
   GRID & PAGE TYPE
=========================== */

const toggleGrid = () => {
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  // Use page 1 to determine current state
  const page1Grid   = document.getElementById("grid-layer-1");
  const nowVisible  = page1Grid && page1Grid.style.display !== "none";
  const nextDisplay = nowVisible ? "none" : "block";

  for (let p = 1; p <= total; p++) {
    const gl = document.getElementById(`grid-layer-${p}`);
    if (gl) gl.style.display = nextDisplay;
  }
  window.sessionStorage.setItem("gridLinesDisplay", nowVisible ? "false" : "true");
};

document.querySelectorAll(".pagetype").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const pageSize = item.textContent.trim();

    const toggleBtn = item
      .closest(".dropdown")
      .querySelector(".dropdown-toggle");
    toggleBtn.textContent = `${pageSize}`;

    window.sessionStorage.setItem("pageSize", pageSize);
    // layoutCanvas(pageSize);
    layoutSvgCanvas(pageSize, (callFromScript = false));
    // alert("line 255...");
  });
});

/* ===========================
   BOX HELPERS
=========================== */

function pxToMm(px, axis = "x") {
  // Use the active page's rect for accurate per-page coordinate conversion
  const activePageNo = (typeof getActivePage === "function") ? getActivePage() : 1;
  const pageRectEl = document.getElementById(`pageRect-${activePageNo}`);

  if (!pageRectEl) {
    console.warn("pxToMm: pageRect not found yet.");
    return 0;
  }

  const rect  = pageRectEl.getBoundingClientRect();
  const pageMm =
    axis === "x"
      ? parseFloat(document.getElementById("xSize")?.textContent || 210)
      : parseFloat(document.getElementById("ySize")?.textContent || 297);

  const pagePx = axis === "x" ? rect.width : rect.height;
  if (pagePx === 0) return 0;
  return (px / pagePx) * pageMm;
}

function mmToPx(mm, axis = "x") {
  const activePageNo = (typeof getActivePage === "function") ? getActivePage() : 1;
  const pageRectEl = document.getElementById(`pageRect-${activePageNo}`);
  if (!pageRectEl) return 0;

  const rect   = pageRectEl.getBoundingClientRect();
  const pageMm =
    axis === "x"
      ? parseFloat(document.getElementById("xSize").textContent)
      : parseFloat(document.getElementById("ySize").textContent);

  const pagePx = axis === "x" ? rect.width : rect.height;
  return (mm / pageMm) * pagePx;
}

// Auto Layout Resolver:

const resolveVerticalCollisions = (activeBox) => {
  const boxes = [...document.querySelectorAll(".text-box")].filter(
    (b) => b !== activeBox,
  );

  const activeRect = activeBox.getBoundingClientRect();

  boxes.forEach((box) => {
    const rect = box.getBoundingClientRect();

    const overlap =
      activeRect.bottom + mmToPx(MIN_VERTICAL_GAP_MM) > rect.top &&
      activeRect.top < rect.bottom;

    if (overlap && rect.top > activeRect.top) {
      const shiftPx =
        activeRect.bottom - rect.top + mmToPx(MIN_VERTICAL_GAP_MM);

      const currentTopMm = parseFloat(box.dataset.topMm);
      const newTopMm = currentTopMm + pxToMm(shiftPx);

      box.dataset.topMm = newTopMm;
      updateBoxPosition(box);
    }
  });
};


/* ===========================
   POSITION UPDATER
=========================== */

function updateBoxPosition(box) {
  box.style.left = `${box.dataset.leftMm}mm`;
  box.style.top = `${box.dataset.topMm}mm`;

  if (box.dataset.widthMm) box.style.width = `${box.dataset.widthMm}mm`;
  if (box.dataset.heightMm) box.style.height = `${box.dataset.heightMm}mm`;
}



/* ===========================
   PRINT
=========================== */

function printPaper() {
  const page = document.getElementById("page");

  // hide grid for print
  page.classList.add("hide-grid");

  // remove offsets for print
  const prevTop = page.style.top;
  const prevLeft = page.style.left;

  page.style.top = "0";
  page.style.left = "0";

  // force 1:1
  zoomLevel = 1;
  applyZoom();

  // restore after print
  window.onafterprint = () => {
    page.classList.remove("hide-grid");
    window.onafterprint = null;
  };

  window.print();
}

const openExportModal = async () => {
  const fileInput = document.getElementById("pdfFileName");
  fileInput.value = ""; // default
  fileInput.focus();

  const modal = new bootstrap.Modal(document.getElementById("exportModal"));
  modal.show();
};

async function confirmExportPDF() {
  const fileInput = document.getElementById("pdfFileName");
  let fileName = fileInput.value.trim();

  if (!fileName) fileName = "print-layout";
  if (!fileName.endsWith(".pdf")) fileName += ".pdf";

  await exportAsPDF(fileName);
  bootstrap.Modal.getInstance(document.getElementById("exportModal")).hide();
}

/**
 * exportAsPDF — multi-page export. One PDF page per canvas page.
 * Two pipelines, selected in Settings ("Vector PDF Export"):
 *   - Vector (svg2pdf.js): each page group is cloned into a standalone SVG
 *     and rendered as true vectors — sharp text at any zoom.
 *   - Raster (html2canvas, default): the whole canvas is captured once at
 *     3× scale, then SLICED per page. Previously the entire stack of pages
 *     (plus 15 mm gaps) was squashed into a single PDF page.
 */
async function exportAsPDF(fileName) {
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  const currentPageSize = window.sessionStorage.getItem("pageSize") || "A4";
  const { width: pdfW, height: pdfH } = pageDimensions[currentPageSize];
  const orientation = pdfW > pdfH ? "l" : "p";

  showToast("Preparing PDF export...", "info");

  const wantVector = localStorage.getItem("vectorPdfExport") === "true";

  try {
    if (wantVector) {
      const ok = await _exportVectorPDF(fileName, total, pdfW, pdfH, orientation);
      if (ok) {
        showToast("PDF Exported! (vector)", "success");
        return;
      }
      showToast("Vector engine unavailable — falling back to raster", "warning");
    }
    await _exportRasterPDF(fileName, total, pdfW, pdfH, orientation);
    showToast("PDF Exported!", "success");
  } catch (err) {
    console.error("PDF Export Error:", err);
    showToast("Export failed", "danger");
  }
}

/** Vector pipeline — requires svg2pdf.js (registers jsPDF.API.svg). */
async function _exportVectorPDF(fileName, total, pdfW, pdfH, orientation) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF(orientation, "mm", [pdfW, pdfH]);
  if (typeof pdf.svg !== "function") return false; // svg2pdf not loaded

  for (let p = 1; p <= total; p++) {
    if (p > 1) pdf.addPage([pdfW, pdfH], orientation);

    const pageGroup = document.getElementById(`pageGroup-${p}`);
    if (!pageGroup) continue;

    // Clone the page into a standalone, origin-aligned SVG and strip
    // everything that must not print.
    const clone = pageGroup.cloneNode(true);
    clone.removeAttribute("transform");
    clone
      .querySelectorAll(
        ".img-resize-handle, .svg-table-grip, .page-watermark, " +
        ".text-highlight, .cell-edit-fo, " +
        `[id^="grid-layer"], [id^="safeZone"]`,
      )
      .forEach((n) => n.remove());

    const tmp = document.createElementNS(SVG_NS, "svg");
    tmp.setAttribute("xmlns", SVG_NS);
    tmp.setAttribute("viewBox", `0 0 ${pdfW} ${pdfH}`);
    tmp.setAttribute("width", `${pdfW}mm`);
    tmp.setAttribute("height", `${pdfH}mm`);
    tmp.style.position = "absolute";
    tmp.style.left = "-10000px";
    tmp.appendChild(clone);
    document.body.appendChild(tmp); // must be in the DOM for style resolution

    try {
      await pdf.svg(tmp, { x: 0, y: 0, width: pdfW, height: pdfH });
    } finally {
      tmp.remove();
    }

    // §7/§8 Stamp DRAFT or TRIAL watermark on vector page
    const wmText = (typeof shouldStampWatermark === "function") ? shouldStampWatermark() : null;
    if (wmText && typeof _stampWatermarkOnPdf === "function") {
      _stampWatermarkOnPdf(pdf, pdfW, pdfH, wmText);
    }
  }

  pdf.save(fileName || "export.pdf");
  return true;
}

/** Raster pipeline — capture once, slice per page. */
async function _exportRasterPDF(fileName, total, pdfW, pdfH, orientation) {
  const page = document.getElementById("canvas");
  const { jsPDF } = window.jspdf;

  // 1. Enter export mode
  document.body.classList.add("export-mode");
  const prevTransform = page.style.transform;
  page.style.transform = "none";

  toggleSafeZone();

  try {
    const capture = await html2canvas(page, {
      scale: 3, // Higher scale (3) is better for A4 print crispness
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      // CRITICAL: Hide UI elements during the "clone" phase
      onclone: (clonedDoc) => {
        const ui = clonedDoc.getElementById("contextMenu");
        const input = clonedDoc.getElementById("imageInput");
        if (ui) ui.style.display = "none";
        if (input) input.style.display = "none";
        // Hide selection highlight rects — the dotted blue boxes around elements
        clonedDoc.querySelectorAll(".text-highlight").forEach((el) => {
          el.setAttribute("visibility", "hidden");
        });
      },
      ignoreElements: (element) => {
        const itemsToExclude = [
          "rulers-layer",
          "grid-layer",
          "contextMenu",
          "imageInput",
        ];
        return (
          itemsToExclude.includes(element.id) ||
          element.classList.contains("grid-style") ||
          element.classList.contains("img-resize-handle") ||
          element.classList.contains("svg-table-grip") ||
          element.classList.contains("page-watermark")
        );
      },
    });

    // The capture covers the whole SVG: width = pageW + ruler gutter + 5,
    // height = all pages + gaps. Slice out each page individually.
    const svgWmm = pdfW + RULER_SIZE_MM + 5;
    const pxPerMm = capture.width / svgWmm;

    const pdf = new jsPDF(orientation, "mm", [pdfW, pdfH]);

    for (let p = 1; p <= total; p++) {
      if (p > 1) pdf.addPage([pdfW, pdfH], orientation);

      const sx = RULER_SIZE_MM * pxPerMm;
      const sy = getPageOffsetY(p, pdfH) * pxPerMm; // RULER + (p-1)*(pageH+GAP)
      const sw = pdfW * pxPerMm;
      const sh = pdfH * pxPerMm;

      const slice = document.createElement("canvas");
      slice.width = Math.round(sw);
      slice.height = Math.round(sh);
      const ctx = slice.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(capture, sx, sy, sw, sh, 0, 0, slice.width, slice.height);

      // §7/§8 Stamp DRAFT or TRIAL watermark if applicable
      const wmText = (typeof shouldStampWatermark === "function") ? shouldStampWatermark() : null;
      if (wmText && typeof _stampWatermarkOnCanvas === "function") {
        _stampWatermarkOnCanvas(ctx, slice.width, slice.height, wmText);
      }

      pdf.addImage(
        slice.toDataURL("image/png", 1.0),
        "PNG", 0, 0, pdfW, pdfH, undefined, "FAST",
      );
    }

    pdf.save(fileName || "export.pdf");
  } finally {
    // Cleanup
    document.body.classList.remove("export-mode");
    page.style.transform = prevTransform;
    toggleSafeZone();
  }
}

const openRawExportModal = async () => {
  const fileInput = document.getElementById("rawExportFileName");
  fileInput.value = ""; // default
  fileInput.focus();

  const modal = new bootstrap.Modal(
    document.getElementById("rawExportFileModal"),
  );
  modal.show();
};

const openRawImportModal = async () => {
  const fileInput = document.getElementById("rawImportFileName");
  fileInput.value = ""; // default
  fileInput.focus();

  const modal = new bootstrap.Modal(
    document.getElementById("rawImportFileModal"),
  );
  modal.show();
};

const previewPrint = () => {
  if (document.body.classList.contains("preview-mode")) {
    exitPreviewMode();
  } else {
    enterPreviewMode();
  }
};

const enterPreviewMode = () => {
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;

  // Save states from page 1 as representative
  const gl1 = document.getElementById("grid-layer-1");
  const sz1 = document.getElementById("safeZone-1");
  window.sessionStorage.setItem("prePreviewGridState",
    gl1 && gl1.style.display !== "none" ? "visible" : "hidden");
  window.sessionStorage.setItem("prePreviewSafeZoneState",
    sz1 ? (sz1.getAttribute("visibility") || "visible") : "hidden");
  // Remember the user's zoom so exiting preview returns to it (not to 100%)
  window.sessionStorage.setItem("prePreviewZoom", String(zoomLevel));

  document.body.classList.add("preview-mode");

  // Hide grids and safe zones across all pages
  for (let p = 1; p <= total; p++) {
    const gl = document.getElementById(`grid-layer-${p}`);
    if (gl) gl.style.display = "none";
    const sz = document.getElementById(`safeZone-${p}`);
    if (sz) sz.setAttribute("visibility", "hidden");
  }

  // Hide selection highlights, resize handles, and page watermarks
  document.querySelectorAll(".text-highlight, .img-resize-handle, .page-watermark")
    .forEach((el) => el.setAttribute("visibility", "hidden"));

  zoomLevel = 0.5;
  applyZoom();

  const btn = document.getElementById("previewPrintBtn");
  if (btn) {
    btn.classList.replace("btn-primary", "btn-warning");
    btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    btn.title = "Click to exit preview";
  }

  showToast("Preview mode — click the preview button again to exit", "info");
};

const exitPreviewMode = () => {
  const total   = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  const preGrid = window.sessionStorage.getItem("prePreviewGridState");
  const preSafe = window.sessionStorage.getItem("prePreviewSafeZoneState");

  document.body.classList.remove("preview-mode");

  for (let p = 1; p <= total; p++) {
    const gl = document.getElementById(`grid-layer-${p}`);
    if (gl) gl.style.display = preGrid === "visible" ? "block" : "none";
    const sz = document.getElementById(`safeZone-${p}`);
    if (sz) sz.setAttribute("visibility", preSafe === "visible" ? "visible" : "hidden");
  }

  // Restore image resize handles and page watermarks
  document.querySelectorAll(".img-resize-handle, .page-watermark")
    .forEach((el) => el.setAttribute("visibility", "visible"));

  // If a text box was focused before/through preview, its selection highlight
  // was force-hidden on entry — show it again so focus state stays visible.
  const focused = document.activeElement;
  if (focused && focused.classList && focused.classList.contains("svg-text-group")) {
    const hl = focused.querySelector(".text-highlight");
    if (hl) hl.setAttribute("visibility", "visible");
  }

  // Restore the zoom the user had before entering preview (was forced to 1)
  const preZoom = parseFloat(window.sessionStorage.getItem("prePreviewZoom"));
  zoomLevel = (!isNaN(preZoom) && preZoom >= ZOOM_MIN && preZoom <= ZOOM_MAX)
    ? preZoom
    : 1;
  applyZoom();

  // Restore button to normal state
  const btn = document.getElementById("previewPrintBtn");
  if (btn) {
    btn.classList.replace("btn-warning", "btn-primary");
    btn.innerHTML = '<i class="fa-solid fa-print"></i>';
    btn.title = "";
  }

  showToast("Exited preview mode", "success");
};

const openSettingsModal = async () => {
  const modal = new bootstrap.Modal(document.getElementById("settingsModal"));
  modal.show();
  // Sync dark-mode checkbox with current session state
  const dmCheckbox = document.getElementById("darkModeCheckbox");
  if (dmCheckbox) {
    dmCheckbox.checked = window.sessionStorage.getItem("displayMode") === "dark";
  }
  // Sync splash-screen checkbox with persisted setting (default: shown)
  const splashCheckbox = document.getElementById("splashScreenCheckbox");
  if (splashCheckbox) {
    splashCheckbox.checked = localStorage.getItem("showSplashScreen") !== "false";
  }
  // Sync inline-cell-edit and vector-PDF checkboxes (default: off)
  const iceCheckbox = document.getElementById("inlineCellEditCheckbox");
  if (iceCheckbox) {
    iceCheckbox.checked = localStorage.getItem("inlineCellEdit") === "true";
  }
  const vpdfCheckbox = document.getElementById("vectorPdfCheckbox");
  if (vpdfCheckbox) {
    vpdfCheckbox.checked = localStorage.getItem("vectorPdfExport") === "true";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const openSettings = document.getElementById("openSettings");
  if (openSettings) {
    document.getElementById("openSettings").addEventListener("click", (e) => {
      e.preventDefault();
      openSettingsModal();
    });
  }
});

/**
 * _initMenuScrollHints — adds a thin "more below" chevron to each side menu so
 * users can tell there are further options to scroll to. Fades out once the
 * menu is scrolled to the bottom or when nothing is clipped.
 */
const _initMenuScrollHints = () => {
  ["left-hand-menu", "right-hand-menu"].forEach((id) => {
    const menu = document.getElementById(id);
    if (!menu || menu.querySelector(".menu-scroll-hint")) return;

    const hint = document.createElement("div");
    hint.className = "menu-scroll-hint";
    hint.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
    menu.appendChild(hint);

    const update = () => {
      const more = (menu.scrollHeight - menu.clientHeight - menu.scrollTop) > 8;
      hint.classList.toggle("hidden-hint", !more);
    };
    menu.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Re-check after layout settles and after fonts/cards render
    setTimeout(update, 300);
    setTimeout(update, 1200);
  });
};

document.addEventListener("DOMContentLoaded", _initMenuScrollHints);
window.addEventListener("load", _initMenuScrollHints);

// Below is necessary as this modal is shown on href and not regular button click:

document.addEventListener("DOMContentLoaded", () => {
  const settingsModalEl = document.getElementById("settingsModal");
  if (!settingsModalEl) return; // not present on the login page
  settingsModalEl.addEventListener("hidden.bs.modal", () => {
    // Remove leftover backdrops
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());

    // Restore body state
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  });
});

const openHelpModal = () => {
  const modal = new bootstrap.Modal(document.getElementById("helpModal"));
  modal.show();
};

const openAboutModal = () => {
  const modal = new bootstrap.Modal(document.getElementById("aboutModal"));
  modal.show();
};

const openTemplateGalleryModal = async () => {
  const modal = new bootstrap.Modal(
    document.getElementById("templateGalleryModal"),
  );
  modal.show();

  // Load Templates from indexedDB:

  const savedTemplates = await getAllRecordsFromDB();
  const container = document.getElementById("templateGridContainer");

  container.innerHTML = "";

  if (savedTemplates.length === 0) {
    container.innerHTML =
      '<div class="col-12 text-center p-4 text-muted small">No custom templates found. Please create and load same first.</div>';
    return;
  }

  savedTemplates.forEach((template) => {
    const createdDate = template.insertedTime
      ? new Date(template.insertedTime).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
      : "—";
    const cardHTML = `
      <div class="col">
          <div class="card h-100 shadow-sm border-0 rounded-3 overflow-hidden template-gallery-card" style="transition: box-shadow 0.2s, transform 0.2s;">
              <div class="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 border-bottom" style="height: 80px;">
                  <i class="fa-regular fa-file-lines text-primary" style="font-size:2.2rem;"></i>
              </div>
              <div class="card-body p-2 d-flex flex-column gap-1">
                  <p class="fw-semibold mb-0 small text-truncate" title="${template.name || 'Untitled'}" style="font-size:0.8rem;">
                      ${template.name || "Untitled"}
                  </p>
                  <p class="text-muted mb-0" style="font-size:0.7rem;">
                      <i class="fa-regular fa-clock me-1"></i>${createdDate}
                  </p>
                  ${template.pageType ? `<span class="badge bg-secondary bg-opacity-10 text-secondary border" style="font-size:0.65rem;width:fit-content;">${template.pageType}</span>` : ''}
              </div>
              <div class="card-footer bg-transparent border-top-0 p-2 d-flex gap-1 justify-content-end">
                  <button class="btn btn-sm btn-primary" style="font-size:0.75rem;" onclick="loadSelectedTemplateFile('${template.id}')">
                      <i class="fa-solid fa-upload me-1"></i>Load
                  </button>
                  <button class="btn btn-sm btn-outline-danger" style="font-size:0.75rem;" onclick="deleteSelectedTemplateFile('${template.id}')">
                      <i class="fa-solid fa-trash-can"></i>
                  </button>
              </div>
          </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", cardHTML);
  });

  // await checkStorage();
};

const openTemplateCreateModal = () => {
  const modal = new bootstrap.Modal(
    document.getElementById("templateCreateModal"),
  );
  modal.show();
};

const openUserLogoutModal = () => {
  const modal = new bootstrap.Modal(document.getElementById("userLogoutModal"));
  modal.show();
};

const showToast = (message, type = "success") => {
  const toastEl  = document.getElementById("appToast");
  const toastMsg = document.getElementById("toastMessage");

  // Normalise "error" → "danger" so Bootstrap bg classes resolve correctly
  const normType = type === "error" ? "danger" : type;

  // Remove any previous bg / text colour + type classes
  toastEl.classList.remove(
    "bg-success", "bg-warning", "bg-danger", "bg-info", "bg-primary", "bg-secondary",
    "text-white", "text-dark",
    "toast-type-success", "toast-type-info", "toast-type-warning", "toast-type-danger",
  );

  // Map type → colour + icon.
  //   info    = blue   (matches request: blue for info)
  //   warning = yellow (matches request: yellow for warnings)
  //   success = blue (app theme)   danger = red
  const map = {
    success: { cls: ["bg-primary", "text-white"], icon: "fa-circle-check"        },
    info:    { cls: ["bg-primary", "text-white"], icon: "fa-circle-info"         },
    warning: { cls: ["bg-warning", "text-dark"],  icon: "fa-triangle-exclamation" },
    danger:  { cls: ["bg-danger",  "text-white"], icon: "fa-circle-xmark"        },
  };
  const cfg = map[normType] || map.success;
  toastEl.classList.add(...cfg.cls, `toast-type-${map[normType] ? normType : "success"}`);

  // Icon + message (message set via textContent to stay safe with dynamic text)
  toastMsg.innerHTML = `<i class="fa-solid ${cfg.icon} toast-icon"></i><span class="toast-text"></span>`;
  toastMsg.querySelector(".toast-text").textContent = message;

  const toast = bootstrap.Toast.getOrCreateInstance(toastEl, {
    autohide:  true,
    delay:     4000,
    animation: true,
  });
  toast.show();
};

/**
 * showConfirmModal — shows a Bootstrap modal with a confirm/cancel choice.
 * Replaces native window.confirm() throughout the app.
 * @param {string} title   — modal heading
 * @param {string} message — body text
 * @param {Function} onConfirm — async callback executed when user clicks Confirm
 */
const showConfirmModal = (title, message, onConfirm, type = "warning") => {
  const modalEl  = document.getElementById("confirmActionModal");
  const titleEl  = document.getElementById("confirmActionTitle");
  const msgEl    = document.getElementById("confirmActionMessage");
  const okBtn    = document.getElementById("confirmActionOkBtn");
  const headerEl = modalEl ? modalEl.querySelector(".modal-header") : null;

  if (!modalEl) return; // fallback if modal not in DOM

  // Type → header colour, icon, OK-button style (blue=info, yellow=warning).
  const styles = {
    info:    { icon: "fa-circle-info",          header: "cm-header-info",    ok: "btn-primary" },
    warning: { icon: "fa-triangle-exclamation", header: "cm-header-warning", ok: "btn-warning" },
    danger:  { icon: "fa-triangle-exclamation", header: "cm-header-danger",  ok: "btn-danger"  },
  };
  const cfg = styles[type] || styles.warning;

  if (headerEl) headerEl.className = `modal-header py-2 ${cfg.header}`;
  titleEl.innerHTML = `<i class="fa-solid ${cfg.icon} me-2"></i><span class="cm-title-text"></span>`;
  titleEl.querySelector(".cm-title-text").textContent = title;
  msgEl.textContent = message;

  // Replace OK button to clear any stacked listeners + reset its style
  const newOkBtn = okBtn.cloneNode(true);
  newOkBtn.className = `btn btn-sm ${cfg.ok}`;
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  newOkBtn.addEventListener("click", async () => {
    modal.hide();
    await onConfirm();
  });

  modal.show();
};

const resetCanvas = () => {
  const modal = new bootstrap.Modal(
    document.getElementById("resetCanvasModal"),
  );
  modal.show();
};

/**
 * _doClearCanvas — core canvas-clearing logic shared by clearCanvasGrid
 * (called from the Reset Canvas modal) and by the document-type preset
 * switcher in letters.js (called without a modal open).
 */
const _doClearCanvas = (pageSize) => {
  const { width, height } = pageDimensions[pageSize];

  window.sessionStorage.setItem("totalPages", "1");
  window.sessionStorage.setItem("currentPage", "1");
  window.sessionStorage.setItem("gridLinesDisplay", "true");

  layoutSvgCanvas(pageSize, true);

  // layoutSvgCanvas preserves content — wipe it explicitly
  const total = getTotalPages();
  for (let p = 1; p <= total; p++) {
    const cl = document.getElementById(`content-layer-${p}`);
    if (cl) cl.innerHTML = "";
    const gl = document.getElementById(`grid-layer-${p}`);
    if (gl) gl.style.display = "block";
  }

  buildRulers(svgRoot, width, height);
  updateElementCounters();
  _undoStack.length = 0;
  _redoStack.length = 0;
  updateUndoRedoCounts();
  if (typeof _updatePageUI === "function") _updatePageUI();
};

const clearCanvasGrid = () => {
  const pageSize = window.sessionStorage.getItem("pageSize");
  _doClearCanvas(pageSize);
  showToast("Canvas reset!", "success");
  // Only hide the modal when it is actually open (not called programmatically)
  const modalEl = document.getElementById("resetCanvasModal");
  const modalInst = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
  if (modalInst) modalInst.hide();
};

const toggleSafeZone = () => {
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  const sz1   = document.getElementById("safeZone-1");
  const nowVis = !sz1 || sz1.getAttribute("visibility") !== "hidden";
  const next   = nowVis ? "hidden" : "visible";

  for (let p = 1; p <= total; p++) {
    const sz = document.getElementById(`safeZone-${p}`);
    if (sz) sz.setAttribute("visibility", next);
  }
  window.sessionStorage.setItem("safeZoneDisplay", next === "visible" ? "true" : "false");
};

const changeSafeZoneSize = () => {
  const safeZoneMm = parseInt(document.getElementById("safeZoneMm").value) + 10;
  const pageSize = window.sessionStorage.getItem("pageSize");
  const { width, height } = pageDimensions[pageSize];
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;

  for (let p = 1; p <= total; p++) {
    const pageGroup = document.getElementById(`pageGroup-${p}`);
    if (pageGroup) setSafeZone(width, height, pageGroup, safeZoneMm, p);
  }
};

/* ===========================
   OVERLAP DETECTION
=========================== */

const checkElementOverlap = (movedBox) => {
  const allObjects = document.querySelectorAll(".design-object");
  const movedRect = movedBox.getBoundingClientRect();

  for (const obj of allObjects) {
    if (obj === movedBox) continue;
    const otherRect = obj.getBoundingClientRect();

    // Standard AABB overlap test
    const overlaps = !(
      movedRect.right <= otherRect.left ||
      movedRect.left >= otherRect.right ||
      movedRect.bottom <= otherRect.top ||
      movedRect.top >= otherRect.bottom
    );

    if (overlaps) {
      showToast("Warning: Two elements are overlapping!", "warning");
      break; // Only warn once per drop
    }
  }
};

/* ===========================
   ELEMENT COUNTERS
=========================== */

const updateElementCounters = () => {
  // Count live elements across ALL pages
  const textCount  = document.querySelectorAll(".svg-text-group").length;
  const imgCount   = document.querySelectorAll(".svg-image-group").length;
  const tableCount = document.querySelectorAll(".svg-table-group").length;
  const shapeCount = document.querySelectorAll(".svg-shape-group").length; // §6

  const elText  = document.getElementById("elemCountText");
  const elImg   = document.getElementById("elemCountImage");
  const elTable = document.getElementById("elemCountTable");
  const elShape = document.getElementById("elemCountShape"); // §6
  if (elText)  elText.textContent  = textCount;
  if (elImg)   elImg.textContent   = imgCount;
  if (elTable) elTable.textContent = tableCount;
  if (elShape) elShape.textContent = shapeCount;
};

/* ===========================
   SNAP TO GRID TOGGLE
=========================== */

const toggleSnapToGrid = () => {
  const current = window.sessionStorage.getItem("snapToGrid") === "true";
  const next = !current;
  window.sessionStorage.setItem("snapToGrid", next ? "true" : "false");
  showToast(next ? "Snap to grid enabled" : "Snap to grid disabled", "success");
};

/* ===========================
   LOCK / UNLOCK ALL ELEMENTS
=========================== */

let _allLocked = false;

const toggleLockAllElements = () => {
  _allLocked = !_allLocked;
  document.querySelectorAll(".design-object").forEach((el) => {
    if (_allLocked) {
      el.classList.add("locked");
    } else {
      el.classList.remove("locked");
    }
  });
  const btn = document.getElementById("lockAllBtn");
  if (btn) {
    btn.innerHTML = _allLocked
      ? '<i class="fa-solid fa-lock"></i>'
      : '<i class="fa-solid fa-lock-open"></i>';
    btn.title = _allLocked ? "Unlock all elements" : "Lock all elements";
  }
  showToast(
    _allLocked ? "All elements locked" : "All elements unlocked",
    "success",
  );
};

/* ===========================
   SHARED PAGE RESTORE HELPER
=========================== */

/**
 * _applyPagesToCanvas — common helper used by version restore and draft restore.
 * Rebuilds the canvas to match a pages array: [{ pageNo, elements }].
 */
const _applyPagesToCanvas = (pages, pageSize) => {
  const neededPages = Math.max(...pages.map(p => p.pageNo));
  window.sessionStorage.setItem("totalPages", neededPages);
  const { width, height } = pageDimensions[pageSize];
  layoutSvgCanvas(pageSize, true);
  buildRulers(document.getElementById("workspace"), width, height);
  if (typeof _updatePageUI === "function") _updatePageUI();
  pages.forEach(({ pageNo, elements }) => {
    const cl = document.getElementById(`content-layer-${pageNo}`);
    if (!cl) return;
    cl.innerHTML = "";
    (elements || []).forEach((obj) => {
      const node = jsonToDom(obj);
      if (!node) return;
      cl.appendChild(node);
      if (typeof reattachInteractions === "function") reattachInteractions(node);
    });
  });
  updateElementCounters();
};

/* ===========================
   VERSION RESTORE
=========================== */

const restoreVersion = (versionId) => {
  showConfirmModal(
    "Restore Version",
    "Restore this version? Current canvas content will be replaced.",
    async () => { await _doRestoreVersion(versionId); }
  );
};

const _doRestoreVersion = async (versionId) => {
  try {
    const versionRecord = await getSingleRecordFromDB(
      versionId,
      "printingVersionLogs",
    );

    if (!versionRecord || !versionRecord.entry) {
      showToast("Version data not found!", "danger");
      return;
    }

    const exportData = versionRecord.entry;
    if (!Array.isArray(exportData) || exportData.length === 0) {
      showToast("Version snapshot is empty, cannot restore.", "warning");
      return;
    }

    // exportData may be a multi-page array [{ pageNo, elements }] or flat array (legacy page 1)
    const pages = (Array.isArray(exportData) && exportData[0] && exportData[0].pageNo !== undefined)
      ? exportData
      : [{ pageNo: 1, elements: exportData }];

    const pageSize2 = window.sessionStorage.getItem("pageSize") || "A4";
    _applyPagesToCanvas(pages, pageSize2);

    // Log restore action
    const logRecord = {
      id: crypto.randomUUID(),
      entry: `Version Restored: ${versionId.slice(0, 8)}`,
      timeStamp: new Date().toISOString(),
    };
    await saveRecordToDB(logRecord, "printingAuditLogs");

    showToast("Version restored successfully!", "success");
  } catch (error) {
    console.error("Version restore error:", error);
    showToast("Version restore failed!", "danger");
  }
};

/* ===========================
   UNDO / REDO
=========================== */

const _undoStack = [];
const _redoStack = [];
const _MAX_UNDO = 20;

const updateUndoRedoCounts = () => {
  const u = document.getElementById("undoCount");
  const r = document.getElementById("redoCount");
  if (u) u.textContent = _undoStack.length;
  if (r) r.textContent = _redoStack.length;
};

/** Re-attach drag/context-menu interactions after DOM reconstruction. */
const reattachInteractions = (node) => {
  if (!node || !node.classList) return;
  if (node.classList.contains("svg-text-group")) {
    enableBoxInteractions(node, "textBox");
    if (typeof addSvgTextGrip === "function") addSvgTextGrip(node);
  } else if (node.classList.contains("svg-table-group")) {
    enableBoxInteractions(node, "tableBox");
    addSvgTableGrip(node);
  } else if (node.classList.contains("svg-image-group")) {
    enableBoxInteractions(node, "imageBox");
    addSvgResizeHandles(node);
  } else if (node.classList.contains("svg-shape-group")) {
    // §6 Shapes — REQUIRED or shapes die on undo/import/version-restore
    enableBoxInteractions(node, "shapeBox");
    if (typeof addSvgShapeHandles === "function") addSvgShapeHandles(node);
  } else if (node.classList.contains("image-box")) {
    // Legacy bare <image> from old exports
    enableBoxInteractions(node, "imageBox");
  }
};

/**
 * UNDO CONTRACT: snapshots must hold the state BEFORE a change, and must be
 * pushed exactly when a change actually happens. Callers therefore either:
 *   - call captureSnapshot() at the START of a mutation (before touching the
 *     DOM), or
 *   - serialise pre-state early via _currentAllPagesSnapshot() and push it
 *     later with _pushUndoSnapshot() once the change is confirmed
 *     (e.g. drag: serialise on mousedown, push on mouseup only if moved).
 */

/** Pushes a pre-change snapshot string onto the undo stack. */
const _pushUndoSnapshot = (snapshotStr) => {
  if (!snapshotStr) return;
  _undoStack.push(snapshotStr);
  if (_undoStack.length > _MAX_UNDO) _undoStack.shift();
  _redoStack.length = 0;
  updateUndoRedoCounts();
  _scheduleDraftSave();
};

/**
 * captureSnapshot — serialises ALL pages. Call BEFORE a destructive change.
 * Format: [{ pageNo, elements: [...domToJson] }, ...]
 */
const captureSnapshot = () => {
  const layers = getAllContentLayers();
  if (!layers.length) return;
  _pushUndoSnapshot(_currentAllPagesSnapshot());
};

/**
 * _scheduleDraftSave — persists the draft AFTER the current call stack so it
 * reflects the post-change state. (Previously the draft stored the PRE-change
 * snapshot, leaving it permanently one step behind the canvas.)
 */
let _draftSaveTimer = null;
const _scheduleDraftSave = () => {
  clearTimeout(_draftSaveTimer);
  _draftSaveTimer = setTimeout(() => {
    try {
      localStorage.setItem("printflow_draft", JSON.stringify({
        pageSize: window.sessionStorage.getItem("pageSize"),
        totalPages: window.sessionStorage.getItem("totalPages"),
        snapshot: _currentAllPagesSnapshot(),
      }));
    } catch (_) { /* quota errors are non-fatal */ }
  }, 0);
};

/**
 * _restoreDraft — checks localStorage for a saved draft and offers to
 * restore it if the canvas is currently empty.
 */
const _restoreDraft = () => {
  try {
    const raw = localStorage.getItem("printflow_draft");
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (!draft || !draft.snapshot) return;

    // Only offer restore when canvas is empty
    const layers = getAllContentLayers();
    const hasContent = layers.some(({ layer }) => layer.children.length > 0);
    if (hasContent) return;

    showConfirmModal(
      "Restore Draft",
      "A saved draft was found. Would you like to restore it?",
      () => {
        // benign question → info (blue) styling handled by type below
        const pageSize = draft.pageSize || "A4";
        const totalPages = parseInt(draft.totalPages, 10) || 1;
        window.sessionStorage.setItem("pageSize", pageSize);
        window.sessionStorage.setItem("totalPages", String(totalPages));
        const { width, height } = pageDimensions[pageSize];
        layoutSvgCanvas(pageSize, true);
        buildRulers(document.getElementById("workspace"), width, height);
        if (typeof _updatePageUI === "function") _updatePageUI();
        _applySnapshot(draft.snapshot);
      },
      "info"
    );
  } catch (_) { /* corrupt draft — ignore */ }
};

/** Reconstructs all pages from a multi-page snapshot JSON string. */
const _applySnapshot = (snapshotJson) => {
  const snapshot = JSON.parse(snapshotJson);

  // Backward-compat: old format was a flat array (single page)
  const pages = (Array.isArray(snapshot) && snapshot[0] && snapshot[0].pageNo !== undefined)
    ? snapshot
    : [{ pageNo: 1, elements: snapshot }];

  pages.forEach(({ pageNo, elements }) => {
    const contentLayer = document.getElementById(`content-layer-${pageNo}`);
    if (!contentLayer) return;
    contentLayer.innerHTML = "";
    (elements || []).forEach((obj) => {
      if (!obj) return;
      const node = jsonToDom(obj);
      if (!node) return;
      contentLayer.appendChild(node);
      reattachInteractions(node);
    });
  });

  updateElementCounters();
};

const _currentAllPagesSnapshot = () => {
  const layers = getAllContentLayers();
  return JSON.stringify(layers.map(({ pageNo, layer }) => ({
    pageNo,
    elements: Array.from(layer.children).map((c) => domToJson(c)),
  })));
};

const undo = () => {
  if (_undoStack.length === 0) { showToast("Nothing to undo", "warning"); return; }
  _redoStack.push(_currentAllPagesSnapshot());
  _applySnapshot(_undoStack.pop());
  updateUndoRedoCounts();
  _scheduleDraftSave();
  showToast("Undo", "success");
};

const redo = () => {
  if (_redoStack.length === 0) { showToast("Nothing to redo", "warning"); return; }
  _undoStack.push(_currentAllPagesSnapshot());
  _applySnapshot(_redoStack.pop());
  updateUndoRedoCounts();
  _scheduleDraftSave();
  showToast("Redo", "success");
};

// Keyboard shortcuts: Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo
document.addEventListener("keydown", (e) => {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const ctrl = isMac ? e.metaKey : e.ctrlKey;

  if (ctrl && !e.shiftKey && e.key === "z") {
    e.preventDefault();
    undo();
  } else if (ctrl && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
    e.preventDefault();
    redo();
  }
});

/* ===========================
   INIT
=========================== */

const setDefaults = (pageSize) => {
  document.getElementById("title-version").innerText = "Version 7";
  document.getElementById("nav-version").innerText =
    "Printing - 2026 (Version 7)";

  window.sessionStorage.setItem("gridLinesDisplay", "true"); // grid on by default
  window.sessionStorage.setItem("pageSize", pageSize);
  // Multi-page defaults
  if (!window.sessionStorage.getItem("totalPages")) {
    window.sessionStorage.setItem("totalPages", "1");
  }
  if (!window.sessionStorage.getItem("currentPage")) {
    window.sessionStorage.setItem("currentPage", "1");
  }

  let stats = {
    textBox: 0,
    imageBox: 0,
    tableBox: 0,
    shapeBox: 0,  // §6 Shapes
    fileExports: {
      html: 0,
      json: 0,
      svg: 0,
    },
    fileImports: {
      html: 0,
      json: 0,
      svg: 0,
    },
  };
  stats = JSON.stringify(stats);
  window.sessionStorage.setItem("stats", stats);

  window.sessionStorage.setItem("versionHistory", "[]");

  // sessionStorage is per-tab and cleared by Reset App Settings — fall back
  // to the localStorage copy and re-seed sessionStorage from it.
  let name = JSON.parse(window.sessionStorage.getItem("loggedInUser"));
  if (!name) {
    name = JSON.parse(window.localStorage.getItem("loggedInUser") || "null");
    if (name) {
      window.sessionStorage.setItem("loggedInUser", JSON.stringify(name));
    }
  }
  const userName = name ? name.userName : "?";
  // Avatar: first letter as initials
  const initials = userName.charAt(0).toUpperCase();
  const userCircle = document.getElementById("userCircle");
  if (userCircle) userCircle.innerText = initials;
  const userNameDisplay = document.getElementById("userNameDisplay");
  if (userNameDisplay) userNameDisplay.innerText = userName;
};

const modifyStats = (elementType, operationType) => {
  let stats = window.sessionStorage.getItem("stats");
  stats = JSON.parse(stats);

  const delta = operationType === "add" ? 1 : -1;
  stats[elementType] += delta;

  stats = JSON.stringify(stats);
  window.sessionStorage.setItem("stats", stats);
};

const onloadInit = () => {
  const pageSize = "A4";
  const { width, height } = pageDimensions[pageSize];
  setDefaults(pageSize);
  layoutSvgCanvas(pageSize, true);
  buildRulers(svgRoot, width, height);
  applyZoom();
  loadAppSettings();
  // Sync page UI after init
  if (typeof _updatePageUI === "function") _updatePageUI();
  _restoreDraft();
};

/**
 * showLayers — entry point for the 3D canvas inspector (§12).
 * Declared as `var` so inspector3d.js can override window.showLayers
 * with toggle3dInspector once that script loads.
 */
// eslint-disable-next-line no-var
var showLayers = () => {
  showToast("3D Inspector loading…", "info");
};

const logOut = () => {
  window.sessionStorage.clear();
  window.localStorage.removeItem("loggedInUser"); // real logout — drop the persistent copy too
  setTimeout(() => {
    window.location.href = "index.html";
  }, 420);
};

// Defer onloadInit until ALL scripts have loaded (exports.js defines loadAppSettings).
// window.load fires after every synchronous <script> tag has executed.
if (svgRoot) window.addEventListener("load", onloadInit);
