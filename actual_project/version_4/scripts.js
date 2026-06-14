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

const DB_NAME = "PrintingDB";
const DB_VERSION = 1;
const STORE_NAME = "printingTemplates";

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // We use 'id' as the unique key (e.g., "A4-Custom-1")
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

async function saveTemplateToDB(templateObj) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // templateObj should look like: { id: "MyTemplate", data: [...] }
    const request = store.put(templateObj);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function getAllTemplatesFromDB() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getSingleTemplateFromDB(templateId) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(templateId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/* ===========================
   ZOOM (VISUAL ONLY)
=========================== */

function applyZoom() {
  // canvas.style.transform = `scale(${zoomLevel})`;
  // canvas.style.transformOrigin = "top left";
  // const zoomPercent = Math.round(zoomLevel * 100);
  // document.getElementById("zoomLevel").innerHTML = `
  //   <span class="badge rounded-pill bg-primary">${zoomPercent}</span> %
  // `;
  // check with svg:
}

function zoomIn() {
  zoomLevel = Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP);
  applyZoom();
}

function zoomOut() {
  zoomLevel = Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP);
  applyZoom();
}

function resetZoom() {
  zoomLevel = 1;
  applyZoom();
}

/* ===========================
   PAGE SIZE / LAYOUT
=========================== */

const renderRulers = (pageWidthMm, pageHeightMm, gridSize) => {
  // Render Ruler X:
  const rulerX = document.getElementById("rulerX");
  rulerX.innerHTML = "";

  const stepPx = gridSize * PX_PER_MM;

  for (let mm = 0; mm <= pageWidthMm; mm += RULER_MINOR_STEP) {
    const isMajor = mm % RULER_MAJOR_STEP === 0;
    const pos = (mm / pageWidthMm) * 100;

    // Tick
    const tick = document.createElement("div");
    tick.className = `tick ${isMajor ? "major" : "minor"}`;
    tick.style.left = `${pos}%`;
    rulerX.appendChild(tick);

    // Label (only for major ticks)
    if (isMajor) {
      const label = document.createElement("div");
      label.className = "label";
      label.style.left = `${pos}%`;
      label.textContent = mm;
      rulerX.appendChild(label);
    }
  }

  // Render Ruler Y:
  const rulerY = document.getElementById("rulerY");
  rulerY.innerHTML = "";

  for (let mm = 0; mm <= pageHeightMm; mm += RULER_MINOR_STEP) {
    const isMajor = mm % RULER_MAJOR_STEP === 0;
    const pos = (mm / pageHeightMm) * 100;

    // Tick
    const tick = document.createElement("div");
    tick.className = `tick ${isMajor ? "major" : "minor"}`;
    tick.style.top = `${pos}%`;
    rulerY.appendChild(tick);

    // Label
    if (isMajor) {
      const label = document.createElement("div");
      label.className = "label";
      label.style.top = `${pos}%`;
      label.textContent = mm;
      rulerY.appendChild(label);
    }
  }
};

const layoutCanvas = (pageSize) => {
  const { width, height } = pageDimensions[pageSize];

  // TRUE PHYSICAL SIZE
  page.style.width = `${width}mm`;
  page.style.height = `${height}mm`;

  page.style.top = "28px";
  page.style.left = "28px";

  // Canvas reserves space (visual only)
  canvas.style.width = `calc(${width}mm + 28px)`;
  canvas.style.height = `calc(${height}mm + 28px)`;

  document.getElementById("xSize").textContent = width;
  document.getElementById("ySize").textContent = height;

  // Set same to Rulers as well:

  const xRulerDiv = document.getElementById("rulerX");
  const yRulerDiv = document.getElementById("rulerY");

  // xRulerDiv.style.width = `${width}mm`;
  // yRulerDiv.style.height = `${height}mm`;

  rulerX.style.width = `${width * PX_PER_MM * zoomLevel}px`;
  rulerY.style.height = `${height * PX_PER_MM * zoomLevel}px`;

  // renderRulers(`${width}mm`, `${height}mm`);

  const gridSize = parseInt(window.sessionStorage.getItem("gridSize"));
  renderRulers(width, height, gridSize);
};

/* ===========================
   CURSOR → MM TRACKING
=========================== */

workspace.addEventListener("mousemove", (e) => {
  if (!pageGroup) return;

  const rect = pageGroup.getBoundingClientRect();

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
  console.log("Line 194....");
  // Need local ref as this is created via SVG Later:

  let gridLinesDisplay;
  let totalXGridlines = parseInt(
    window.sessionStorage.getItem("totalXGridlines"),
  );
  let totalYGridlines = parseInt(
    window.sessionStorage.getItem("totalYGridlines"),
  );
  const gridSize = parseInt(window.sessionStorage.getItem("gridSize"));

  gridLinesDisplay = JSON.parse(
    window.sessionStorage.getItem("gridLinesDisplay"),
  );

  let gridLayer = document.getElementById("grid-layer");

  if (gridLayer.style.display == "none") {
    gridLayer.style.display = "block";
    window.sessionStorage.setItem("gridLinesDisplay", "true");
  } else {
    gridLayer.style.display = "none";
    window.sessionStorage.setItem("gridLinesDisplay", "false");
  }
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
  // 1. Target the actual white page rectangle
  const page = document.getElementById("pageRect");

  if (!page) {
    // If layout hasn't run yet, return 0 to prevent crash
    console.warn("pxToMm: pageRect not found yet.");
    return 0;
  }

  // 2. Get the current size of the page on the user's screen (pixels)
  const rect = page.getBoundingClientRect();

  // 3. Get the intended real-world size (mm) from your labels
  const xSizeEl = document.getElementById("xSize");
  const ySizeEl = document.getElementById("ySize");

  const pageMm =
    axis === "x"
      ? parseFloat(xSizeEl?.textContent || 210)
      : parseFloat(ySizeEl?.textContent || 297);

  // 4. Calculate the ratio
  // How many pixels on screen represent 1mm?
  const pagePx = axis === "x" ? rect.width : rect.height;

  if (pagePx === 0) return 0; // Prevent division by zero

  return (px / pagePx) * pageMm;
}

function mmToPx(mm, axis = "x") {
  const rect = page.getBoundingClientRect();
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
   ADD TEXT BOX
=========================== */

const wrapSvgText = (textEl, maxWidth) => {
  if (!textEl || !textEl.ownerSVGElement) return;

  // const rawText = textEl.textContent;
  let rawText =
    textEl.dataset.rawText ||
    Array.from(textEl.querySelectorAll("tspan"))
      .map((ts) => ts.textContent)
      .join(" ") ||
    textEl.textContent;
  rawText = rawText.trim();

  // const paragraphs = rawText.split("\n");
  const paragraphs = rawText.split("\n").map((p) => p.trim());

  // Clear existing tspans
  textEl.textContent = "";

  // const x = parseFloat(textEl.getAttribute("x"));
  // const baseY = parseFloat(textEl.getAttribute("y"));

  // Use data attributes as source of truth — not live x/y
  // const x = parseFloat(textEl.dataset.baseX ?? textEl.getAttribute("x"));
  // const baseY = parseFloat(textEl.dataset.baseY ?? textEl.getAttribute("y"));

  const fontSize = parseFloat(textEl.getAttribute("font-size"));

  const x = 0;
  const baseY = 0;

  // Re-assert x/y after clearing — safety net
  textEl.setAttribute("x", x);
  textEl.setAttribute("y", baseY);

  // Deterministic numeric line height
  const numericLineHeight = fontSize * 1.4;
  // const numericLineHeight = fontSize * 1.0;
  let lineIndex = 0;

  paragraphs.forEach((paragraph, pIndex) => {
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
        // tspan.setAttribute("x", x);
        // tspan.setAttribute("y", baseY + lineIndex * numericLineHeight);

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
  const pageType = window.sessionStorage.getItem("pageType");
  // const fontSize = pageDimensions[pageType].fontSize;

  const id = crypto.randomUUID();
  g.setAttribute("id", `group-${id}`);
  g.setAttribute("tabindex", "0"); // Makes it focusable
  g.classList.add("svg-text-group");

  // g.setAttribute("transform", `translate(${x}, ${y})`);

  // Setup Highlight Rect (Hidden by default via CSS)
  highlight.classList.add("text-highlight");
  highlight.setAttribute("fill", "rgba(0, 123, 255, 0.1)");
  highlight.setAttribute("stroke", "#007bff");
  highlight.setAttribute("stroke-width", "0.5");
  highlight.setAttribute("visibility", "hidden");

  // Setup Text
  textBox.classList.add("svg-text-box", "design-object");
  textBox.setAttribute("id", id);
  // textBox.setAttribute("x", x);
  // textBox.setAttribute("y", y);

  textBox.setAttribute("x", 0);
  textBox.setAttribute("y", 0);

  g.dataset.baseX = x;
  g.dataset.baseY = y;
  g.dataset.width = w;

  g.setAttribute("transform", `translate(${x}, ${y})`);

  // textBox.setAttribute("font-size", "4");
  textBox.setAttribute("font-size", `${fontSize}`);
  textBox.textContent = textContent;

  // Edit Bug Fix, line 417 -> 420
  textBox.dataset.baseX = x; // ← store originals
  textBox.dataset.baseY = y;
  textBox.dataset.width = w; // ← also store width here for edit use

  g.appendChild(highlight);
  g.appendChild(textBox);
  document.getElementById("content-layer").appendChild(g);

  // Focus Events
  g.addEventListener("focus", () => {
    const bbox = textBox.getBBox();
    const padding = 0.5;
    highlight.setAttribute("x", bbox.x - 1);
    highlight.setAttribute("y", bbox.y - 1);
    highlight.setAttribute("width", bbox.width + 2);
    highlight.setAttribute("height", bbox.height + 2);

    // highlight.setAttribute("x", bbox.x + padding);
    // highlight.setAttribute("y", bbox.y - 1);
    // highlight.setAttribute("width", bbox.width - padding * 2);
    // highlight.setAttribute("height", bbox.height + 2);
    highlight.setAttribute("visibility", "visible");
  });

  g.addEventListener("blur", () =>
    highlight.setAttribute("visibility", "hidden"),
  );

  wrapSvgText(textBox, w);
  enableBoxInteractions(g, "textBox");
};

// addTableBox:

const addTableBox = () => {
  window.alert("Please add fx body for same");
};

/* ===========================
   ADD IMAGE BOX
=========================== */

function triggerImageBox() {
  document.getElementById("imageInput").click();
}

document.getElementById("imageInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  //   const reader = new FileReader();
  //   reader.onload = () => addImageBox(reader.result);
  //   reader.readAsDataURL(file);

  const imageURL = URL.createObjectURL(file);
  // const bitmap = await createImageBitmap(file);

  // const imageWidth = ((bitmap.width * 25.4) / 96).toFixed(2);
  // const imageHeight = ((bitmap.height * 25.4) / 96).toFixed(2);
  // console.log(bitmap.width, bitmap.height);
  // bitmap.close(); // Important: clear memory

  const imageWidth = 100;
  const imageHeight = 100;
  addImageBox(imageURL, imageWidth, imageHeight);

  // setTimeout(() => {
  //   URL.revokeObjectURL(imageURL);
  // }, 1000);
  e.target.value = "";
});

const addImageBox = (src, imageWidth, imageHeight, safeMarginMm = 10) => {
  const imageBox = document.createElementNS(SVG_NS, "image");
  const startX = safeMarginMm + 5;
  const startY = safeMarginMm + 5;

  imageBox.setAttribute("href", src);
  imageBox.classList.add("image-box", "design-object");
  imageBox.setAttribute("id", crypto.randomUUID());
  imageBox.setAttribute("x", startX);
  imageBox.setAttribute("y", startY);
  imageBox.setAttribute("width", `${imageWidth}`);
  imageBox.setAttribute("height", `${imageHeight}`);
  imageBox.setAttribute("preserveAspectRatio", "xMidYMid meet");
  // imageBox.classList.add("svg-image");
  const contentLayer = document.getElementById("content-layer");
  contentLayer.appendChild(imageBox);

  imageBox.onload = () => {
    URL.revokeObjectURL(src);
    // console.log("Memory released for:", src);
  };

  enableBoxInteractions(imageBox, "imageBox");
  addResizeHandle(imageBox);
  updateBoxPosition(imageBox);
  modifyStats("imageBox", "add");
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
   DRAGGING (MM SAFE)
=========================== */

const showContextMenu = (target, elementType) => {
  const canvas = document.getElementById("canvas");
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

  // console.log(`left: ${left}`);
  // console.log(`top: ${top}`);
  contextMenu.style.left = `${(left / 3.75).toFixed(2)}mm`;
  contextMenu.style.top = `${(top / 4).toFixed(2)}mm`;
  contextMenu.style.position = "absolute";
  contextMenu.style.zIndex = 9999;
  contextMenu.classList.remove("hidden");
  contextMenu.style.display = "block";

  const contextOptionsDiv = document.getElementById("contextOptions");
  let contextOptionsHTML;

  let textBoxValue = document.getElementById(`${target.id}`).textContent;

  if (elementType == "textBox") {
    // contextOptionsHTML = `
    //   <div class="d-flex align-items-center input-group-sm">
    //     <span class="input-group-textx left-hand-menu-font-size">Enter Text: </span>
    //     <input type="text" class="form-control" id="svgTextBoxEditinput" value="${textBoxValue}" oninput="changeTextBoxTextContent('${target.id}')">
    //   </div>
    //   <div class="d-flex align-items-center input-group-sm">
    //     <span class="input-group-textx left-hand-menu-font-size">Font Size: </span>
    //     <input
    //         type="number"
    //         class="form-controlx rounded-start ms-3"
    //         id="${target.id}-fontSize"
    //         min="4"
    //         max="20"
    //         step="1"
    //         value="4"
    //         inputmode="numeric"
    //         onchange="changeTextBoxFontSize('${target.id}')"
    //     />
    //     <span class="input-group-textx">pt</span>
    //   </div>
    //   <div class="d-flex align-items-center input-group-sm">
    //     <span class="input-group-textx left-hand-menu-font-size">Font Bold: </span>
    //     <label class="circular-switchx android-switch-m3 ms-3">
    //         <input type="checkbox" id="boldFontToggle" onchange="toggleBoldFont('${target.id}')">
    //         <span class="slider"></span>
    //     </label>
    //   </div>
    //   <div class="d-flex align-items-center input-group-sm">
    //     <span class="input-group-textx left-hand-menu-font-size">Font Italic: </span>
    //     <label class="circular-switchx android-switch-m3 ms-3">
    //         <input type="checkbox" id="italicFontToggle" onchange="toggleItalicFont('${target.id}')">
    //         <span class="slider"></span>
    //     </label>
    //   </div>
    // `;
    contextOptionsHTML = `
        <div class="context-menu-section px-3 py-2">
            <label class="menu-label small text-muted mb-1">Text Content</label>
            <input type="text" class="form-control form-control-sm border-0 bg-light"
                   id="svgTextBoxEditinput" value="${textBoxValue}"
                   oninput="changeTextBoxTextContent('${target.id}')"
                   placeholder="Enter text...">
        </div>

        <div class="dropdown-divider"></div>

        <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-1">
            <span class="menu-text">Font Size</span>
            <div class="d-flex align-items-center">
                <input type="number" class="form-control form-control-sm text-end border-0 bg-transparent p-0"
                       id="${target.id}-fontSize" min="4" max="20" value="4"
                       style="width: 35px;" onchange="changeTextBoxFontSize('${target.id}')">
                <span class="small text-muted ms-1">pt</span>
            </div>
        </div>

        <div class="dropdown-divider"></div>

        <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-1">
            <span class="menu-text">Bold</span>
            <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" role="switch" id="boldFontToggle"
                       onchange="toggleBoldFont('${target.id}')">
            </div>
        </div>

        <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-1">
            <span class="menu-text">Italic</span>
            <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" role="switch" id="italicFontToggle"
                       onchange="toggleItalicFont('${target.id}')">
            </div>
        </div>
    `;
  } else if (elementType == "imageBox") {
    // contextOptionsHTML += `
    //   <div class="d-flex align-items-center input-group-sm">
    //     <span class="input-group-textx left-hand-menu-font-size">Rotate Image: </span>
    //     <input
    //         type="number"
    //         class="form-controlx rounded-start ms-3"
    //         id="${target.id}-imageAngle"
    //         min="0"
    //         max="360"
    //         step="90"
    //         value="0"
    //         inputmode="numeric"
    //         onchange="rotateImageAngle('${target.id}')"
    //     />
    //     <span class="input-group-textx">&nbsp;degrees</span>
    //   </div>
    //   <div class="d-flex align-items-center input-group-sm">
    //     <span class="input-group-textx left-hand-menu-font-size">Flip Image: </span>
    //     <label class="circular-switchx android-switch-m3 ms-3">
    //         <input type="checkbox" id="flipImageToggle" onchange="toggleImageFlip('${target.id}', true)">
    //         <span class="slider"></span>
    //     </label>
    //   </div>
    //   <div class="d-flex align-items-center input-group-sm">
    //     <span class="input-group-textx left-hand-menu-font-size">Resize Image: </span>
    //     <input
    //         type="number"
    //         class="form-controlx rounded-start ms-3"
    //         id="${target.id}-imageWidth"
    //         min="0"
    //         max="1080"
    //         step="1"
    //         value="0"
    //         inputmode="numeric"
    //     />
    //     <input
    //         type="number"
    //         class="form-controlx rounded-start ms-3"
    //         id="${target.id}-imageHeight"
    //         min="0"
    //         max="1920"
    //         step="1"
    //         value="0"
    //         inputmode="numeric"
    //     />
    //     <button
    //         class="btn btn-sm1 btn-primary"
    //         onclick="toggleImageResize('${target.id}')"
    //     >Resize
    //     </button>
    //   </div>
    // `;
    contextOptionsHTML = `
        <!-- Rotate Section -->
        <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-1">
            <span class="menu-text"><i class="fa-solid fa-rotate me-2 opacity-50"></i>Rotate</span>
            <div class="d-flex align-items-center">
                <input type="number" class="form-control form-control-sm text-end border-0 bg-transparent p-0"
                       id="${target.id}-imageAngle" min="0" max="360" step="90" value="0"
                       style="width: 45px;" onchange="rotateImageAngle('${target.id}')">
                <span class="small text-muted ms-1">°</span>
            </div>
        </div>

        <!-- Flip Section -->
        <div class="context-menu-item d-flex align-items-center justify-content-between px-3 py-1">
            <span class="menu-text"><i class="fa-solid fa-arrows-left-right me-2 opacity-50"></i>Flip Horizontal</span>
            <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" role="switch" id="flipImageToggle"
                       onchange="toggleImageFlip('${target.id}', true)">
            </div>
        </div>

        <div class="dropdown-divider"></div>

        <!-- Resize Section -->
        <div class="context-menu-section px-3 py-2">
            <label class="menu-label small text-muted mb-2 d-block">Dimensions (px)</label>
            <div class="d-flex gap-2 align-items-center">
                <input type="number" class="form-control form-control-sm border-0 bg-light text-center"
                       id="${target.id}-imageWidth" placeholder="W" style="width: 60px;">
                <span class="text-muted">×</span>
                <input type="number" class="form-control form-control-sm border-0 bg-light text-center"
                       id="${target.id}-imageHeight" placeholder="H" style="width: 60px;">

                <button class="btn btn-sm btn-primary py-0 px-2"
                        style="font-size: 11px; height: 24px;"
                        onclick="toggleImageResize('${target.id}')">
                    Apply
                </button>
            </div>
        </div>
    `;
  }

  contextOptionsDiv.innerHTML = contextOptionsHTML;

  console.log(target.getAttribute("elementType"));

  // Svg custom dattibutes are fetched this way:
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
  contextMenu.classList.add("hidden");
  activeElement = null;
};

// TextBox:

const changeTextBoxTextContent = (textBoxId) => {
  let text = document.getElementById("svgTextBoxEditinput").value;

  console.log(`textBoxId: ${textBoxId}`);

  textBoxId = textBoxId.replace("group-", "");
  let svgTextBox = document.getElementById(textBoxId);
  console.log(svgTextBox);

  const svgTextBoxWidth = parseFloat(svgTextBox.dataset.width);
  console.log(svgTextBoxWidth);
  // svgTextBox.textContent = text;
  svgTextBox.dataset.rawText = text;

  svgTextBox.textContent = "";
  svgTextBox.textContent = text;

  wrapSvgText(svgTextBox, svgTextBoxWidth);
  // document.fonts.ready.then(() => {
  //   wrapSvgText(textEl, maxWidth);
  // });
};

const changeTextBoxFontSize = (divID) => {
  const fontSize = document.getElementById(`${divID}-fontSize`).value;

  // Get the text element inside the group
  const groupEl = document.getElementById(divID);
  const textEl = groupEl.querySelector("text");

  if (!textEl) return;

  // Set font-size as SVG attribute — not CSS style
  // SVG font-size attribute uses SVG units, not pt
  textEl.setAttribute("font-size", fontSize);

  // Rewrap since font size change affects line break points
  const maxWidth = parseFloat(textEl.dataset.width);
  const rawText =
    textEl.dataset.rawText ||
    Array.from(textEl.querySelectorAll("tspan"))
      .map((ts) => ts.textContent.trim())
      .filter(Boolean)
      .join("\n");

  textEl.dataset.rawText = rawText; // ensure it's stored
  textEl.textContent = rawText;

  wrapSvgText(textEl, maxWidth);
};

const toggleBoldFont = (divID) => {
  // console.log(divID);
  document.getElementById(divID).classList.toggle("text-box-bold");
};

const toggleItalicFont = (divID) => {
  // console.log(divID);
  document.getElementById(divID).classList.toggle("text-box-italic");
};

const rotateImageAngle = (divID) => {
  const imgElement = document.getElementById(divID);
  if (!imgElement) return;

  // 1. Get current dimensions to find the center
  const x = parseFloat(imgElement.getAttribute("x"));
  const y = parseFloat(imgElement.getAttribute("y"));
  const width = parseFloat(imgElement.getAttribute("width"));
  const height = parseFloat(imgElement.getAttribute("height"));

  // 2. Calculate center point
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  const degrees = document.getElementById(`${divID}-imageAngle`).value;

  // 3. Apply the transformation
  // SVG rotate syntax: rotate(angle, cx, cy)
  imgElement.setAttribute(
    "transform",
    `rotate(${degrees}, ${centerX}, ${centerY})`,
  );
};

const toggleImageFlip = (divID, horizontal = false, vertical = false) => {
  const imgElement = document.getElementById(divID);
  if (!imgElement) return;

  // 1. Track state using a data-attribute (defaults to '1' if not set)
  let currentScaleX = parseFloat(imgElement.getAttribute("data-scale-x")) || 1;
  let currentScaleY = parseFloat(imgElement.getAttribute("data-scale-y")) || 1;

  // 2. Invert the specific axis
  if (horizontal === true) currentScaleX *= -1;
  if (vertical === true) currentScaleY *= -1;

  // 3. Save the new state back to the element
  imgElement.setAttribute("data-scale-x", currentScaleX);
  imgElement.setAttribute("data-scale-y", currentScaleY);

  // 4. Apply the transformation with centering
  const x = parseFloat(imgElement.getAttribute("x"));
  const y = parseFloat(imgElement.getAttribute("y"));
  const w = parseFloat(imgElement.getAttribute("width"));
  const h = parseFloat(imgElement.getAttribute("height"));

  // Calculate translation to keep it in place
  const transX = currentScaleX === -1 ? -(2 * x + w) : 0;
  const transY = currentScaleY === -1 ? -(2 * y + h) : 0;

  imgElement.setAttribute(
    "transform",
    `scale(${currentScaleX}, ${currentScaleY}) translate(${transX}, ${transY})`,
  );
};

const toggleImageResize = (divID) => {
  const imgElement = document.getElementById(divID);
  if (!imgElement) return;

  const newImgWidth = parseInt(
    document.getElementById(`${divID}-imageWidth`).value,
  );
  const newImgHeight = parseInt(
    document.getElementById(`${divID}-imageHeight`).value,
  );

  console.log(typeof newImgWidth);
  console.log(newImgWidth);
  console.log(newImgHeight);

  if (newImgHeight == 0 || newImgWidth == 0) {
    showToast("Image Width or Height cannot be zero", (type = "warning"));
    return;
  }

  const pageSize = window.sessionStorage.getItem("pageSize");
  console.log(pageSize);

  console.log(pageDimensions);
  const { pageWidth, pageHeight } = pageDimensions[pageSize];

  console.log(pageWidth);
  console.log(pageHeight);

  // Check this part later
  if (newImgWidth > pageWidth - 20 || newImgHeight > pageHeight - 20) {
    showToast(
      "Image Width or Height cannot be more than page size",
      (type = "warning"),
    );
    return;
  }

  imgElement.setAttribute("width", `${newImgWidth}mm`);
  imgElement.setAttribute("height", `${newImgHeight}mm`);

  // Also set as styles (to override any CSS rules)
  // Dont use CSS, need svg kind of width and height
  // also add safeguard for img should not exceed page constraints
  // imgElement.style.width = `${newImgWidth}mm`;
  // imgElement.style.height = `${newImgHeight}mm`;
};

// Drag Function:

const enableBoxInteractions = (box, elementType) => {
  let isDragging = false;
  let startSVGPoint = null;
  let startTranslateX = 0;
  let startTranslateY = 0;

  const svg = box.ownerSVGElement;

  /* -----------------------------
     Helper: Convert mouse to SVG coords
  ----------------------------- */
  function getMousePosition(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  /* -----------------------------
     Helper: Read current translate
  ----------------------------- */
  function getCurrentTranslate() {
    const transform = box.getAttribute("transform");
    if (!transform) return { x: 0, y: 0 };

    const match = /translate\(([^,]+)[ ,]([^)]+)\)/.exec(transform);
    return match
      ? { x: parseFloat(match[1]), y: parseFloat(match[2]) }
      : { x: 0, y: 0 };
  }

  /* -----------------------------
     Double Click → Edit
  ----------------------------- */
  box.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    enterEditMode(box);
  });

  if (elementType === "textBox") {
    box.addEventListener("blur", () => {
      box.setAttribute("contentEditable", "false");
    });
  }

  /* -----------------------------
     Drag Start
  ----------------------------- */
  box.addEventListener("mousedown", (e) => {
    if (box.classList.contains("editing") || box.classList.contains("locked"))
      return;

    isDragging = true;

    startSVGPoint = getMousePosition(e);

    const current = getCurrentTranslate();
    startTranslateX = current.x;
    startTranslateY = current.y;

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  /* -----------------------------
     Drag Move
  ----------------------------- */
  function onMove(e) {
    if (!isDragging) return;

    const currentSVG = getMousePosition(e);

    const dx = currentSVG.x - startSVGPoint.x;
    const dy = currentSVG.y - startSVGPoint.y;

    let updatedX = startTranslateX + dx;
    let updatedY = startTranslateY + dy;

    // Optional: Prevent negative movement
    updatedX = Math.max(0, updatedX);
    updatedY = Math.max(0, updatedY);

    // Optional: Safe Zone Warning
    const SAFE_ZONE_LIMIT = 10;
    if (updatedX < SAFE_ZONE_LIMIT || updatedY < SAFE_ZONE_LIMIT) {
      if (typeof showToast === "function") {
        showToast("Crossing Safe Zone!", "warning");
      }
    }

    // Update transform
    box.setAttribute("transform", `translate(${updatedX}, ${updatedY})`);

    // Keep dataset in sync
    box.dataset.left = updatedX;
    box.dataset.top = updatedY;

    // Optional external sync
    if (typeof updateBoxPosition === "function") {
      updateBoxPosition(box);
    }
  }

  /* -----------------------------
     Drag End
  ----------------------------- */
  function onUp() {
    isDragging = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }

  /* -----------------------------
     Context Menu
  ----------------------------- */
  box.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (box.classList.contains("locked")) return;
    showContextMenu(box, elementType);
  });
};

removeBtn.addEventListener("click", () => {
  if (activeElement) {
    activeElement.remove();
    activeElement = null;
  }
  closeContextMenu();
});

/* ===========================
   RESIZE HANDLE (MM SAFE)
=========================== */

const addResizeHandle = (box) => {
  const handle = document.createElement("div");
  handle.className = "resize-img-handle";
  box.appendChild(handle);

  let resizing = false;
  let startX, startY;
  let startW, startH;

  handle.addEventListener("mousedown", (e) => {
    if (box.classList.contains("locked")) return;
    e.stopPropagation();

    resizing = true;
    startX = e.clientX;
    startY = e.clientY;

    startW = parseFloat(box.dataset.widthMm);
    startH = parseFloat(box.dataset.heightMm);

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stop);
  });

  function resize(e) {
    if (!resizing) return;

    box.dataset.widthMm = startW + pxToMm(e.clientX - startX, "x");
    box.dataset.heightMm = startH + pxToMm(e.clientY - startY, "y");

    updateBoxPosition(box);
  }

  function stop() {
    resizing = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stop);
  }
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

    // Hide the menu once:
    closeContextMenu();
  }
});

const closeContextMenu = () => {
  document.getElementById("contextMenu").style.display = "none";
  activeElement = null;
};

const removeElement = () => {
  const divToBeClosed = window.sessionStorage.getItem("divToBeClosed");
  const currentElement = document.getElementById(divToBeClosed);

  const contentLayer = document.getElementById("content-layer");
  contentLayer.removeChild(currentElement);

  const elementStatTobeReduced = window.sessionStorage.getItem(
    "elementStatTobeReduced",
  );
  modifyStats(elementStatTobeReduced, "subtract");
};

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

// async function exportAsPDF(fileName) {
//   const page = document.getElementById("canvas"); // check actual svg part, pdf export is working

//   // Ensure 1:1 scale
//   const prevTransform = page.style.transform;
//   page.style.transform = "none";

//   // 1. Enter export mode
//   document.body.classList.add("export-mode");

//   // 2. Wait one frame so styles apply
//   await new Promise((r) => requestAnimationFrame(r));

//   // Reset Text gap lines:

//   const canvas = await html2canvas(page, {
//     scale: 2, // print quality, later make same as user config via UI / UX
//     backgroundColor: "#fff",
//     useCORS: true,
//   });

//   // 4. Exit export mode
//   document.body.classList.remove("export-mode");

//   page.style.transform = prevTransform;

//   const imgData = canvas.toDataURL("image/png");

//   const { jsPDF } = window.jspdf;

//   // Set Page Size below:
//   const pdf = new jsPDF("portrait", "mm", "a4");

//   pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
//   // pdf.save("print.pdf");

//   showToast("PDF export in process...", "success");

//   setTimeout(() => {
//     pdf.save(fileName);
//   }, 3000);
// }

async function exportAsPDF(fileName) {
  const page = document.getElementById("canvas");
  const { jsPDF } = window.jspdf;

  showToast("Preparing PDF export...", "info");

  // 1. Enter export mode
  document.body.classList.add("export-mode");
  const prevTransform = page.style.transform;
  page.style.transform = "none";

  toggleSafeZone();

  try {
    const canvas = await html2canvas(page, {
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
      },
      ignoreElements: (element) => {
        // Add IDs or Classes you want to skip
        const itemsToExclude = [
          "rulers-layer",
          "grid-layer",
          "contextMenu",
          "imageInput",
        ];
        return (
          itemsToExclude.includes(element.id) ||
          element.classList.contains("grid-style")
        );
      },
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");

    // PDF A4 is 210 x 297mm
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297, undefined, "FAST");

    pdf.save(fileName || "export.pdf");
    showToast("PDF Exported!", "success");
  } catch (err) {
    console.error("PDF Export Error:", err);
    showToast("Export failed", "danger");
  } finally {
    // 4. Cleanup
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

// const confirmRawExportFile = () => {
//
// };

const previewPrint = () => {
  toggleGrid();
  toggleSafeZone();
  zoomLevel = 0.5;
  applyZoom();

  setTimeout(() => {
    // console.log("on line 668....");
    showToast(
      "Print Preview will revert to document edit mode in 5 secs",
      "warning",
    );
    zoomLevel = 1;
    toggleGrid();
    toggleSafeZone();
    applyZoom();
  }, 5000);
};

// const openSettingsModal = async () => {
//   const modal = new bootstrap.Modal(document.getElementById("settingsModal"));
//   modal.show();
// };
const openSettingsModal = async () => {
  const modal = new bootstrap.Modal(document.getElementById("settingsModal"));
  modal.show();
};

document.getElementById("openSettings").addEventListener("click", (e) => {
  e.preventDefault();
  openSettingsModal();
});

// Below is necessary as this modal is shown on href and not regular button click:
const settingsModalEl = document.getElementById("settingsModal");
settingsModalEl.addEventListener("hidden.bs.modal", () => {
  // Remove leftover backdrops
  document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());

  // Restore body state
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
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

  const savedTemplates = await getAllTemplatesFromDB();
  const container = document.getElementById("templateGridContainer");

  container.innerHTML = "";

  if (savedTemplates.length === 0) {
    container.innerHTML =
      '<div class="col-12 text-center p-4 text-muted small">No custom templates found. Please create and load same first.</div>';
    return;
  }

  savedTemplates.forEach((template) => {
    const cardHTML = `
      <div class="col">
          <div
              class="card h-100 template-card shadow-sm"
          >
              <div class="card-body text-center p-2">
                  <div
                      class="bg-light mb-2 rounded d-flex align-items-center justify-content-center"
                      style="height: 80px"
                  >
                      <!-- <i class="bi bi-file-earmark-text fs-2 text-primary"></i> -->
                      <i class="fa-regular fa-file-lines template-grid"></i>
                  </div>
                  <h6 class="card-title small mb-2 text-truncate" title="${template.name}">
                      Name: ${template.name || "Untitled"}
                  </h6>
                  <!-- <small class="text-muted" style="font-size: 0.6rem;">
                      ${new Date(template.updatedTime || Date.now()).toLocaleDateString()}
                  </small> -->
                  <button
                    class="btn btn-sm btn-primary"
                    onclick="loadSelectedTemplateFile('${template.id}')
                  ">
                  Load
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

const showToast = (message, type = "success") => {
  const toastEl = document.getElementById("appToast");
  const toastMsg = document.getElementById("toastMessage");

  toastMsg.textContent = message;

  toastEl.classList.remove("toast-success", "toast-warning", "toast-error");
  toastEl.classList.add(`toast-${type}`);

  const toast = bootstrap.Toast.getOrCreateInstance(toastEl, {
    autohide: true,
    delay: 5000,
    animation: true,
  });
  toast.show();
};

const resetCanvas = () => {
  const modal = new bootstrap.Modal(
    document.getElementById("resetCanvasModal"),
  );
  modal.show();
};

const clearCanvasGrid = () => {
  const pageSize = window.sessionStorage.getItem("pageSize");
  const { width, height } = pageDimensions[pageSize];

  layoutSvgCanvas(pageSize);
  buildRulers(svgRoot, width, height);

  showToast("Canvas Grid is Reset...!!!");
  bootstrap.Modal.getInstance(
    document.getElementById("resetCanvasModal"),
  ).hide();
};

const toggleSafeZone = () => {
  // Need local ref as this is created via SVG Later:
  const safeZone = document.getElementById("safeZone");
  if (safeZone) {
    safeZone.style.display =
      safeZone.style.display === "none" ? "block" : "none";

    if (safeZone.style.display == "block") {
      window.sessionStorage.setItem("safeZoneDisplay", "true");
    } else {
      window.sessionStorage.setItem("safeZoneDisplay", "false");
    }
  }
};

const changeSafeZoneSize = () => {
  let safeZoneMm = parseInt(document.getElementById("safeZoneMm").value);
  const pageSize = window.sessionStorage.getItem("pageSize");
  const { width, height } = pageDimensions[pageSize];

  safeZoneMm = safeZoneMm + 10;
  setSafeZone(width, height, svgRoot, safeZoneMm);
};

/* ===========================
   INIT
=========================== */

const setDefaults = (pageSize) => {
  document.getElementById("title-version").innerText = "Version 4";
  document.getElementById("nav-version").innerText =
    "Printing - 2026 (Version 4)";

  window.sessionStorage.setItem("gridLinesDisplay", "false");
  window.sessionStorage.setItem("pageSize", pageSize);

  let stats = {
    textBox: 0,
    imageBox: 0,
    fileExports: {
      html: 0,
      json: 0,
    },
    fileImports: {
      html: 0,
      json: 0,
    },
  };
  stats = JSON.stringify(stats);
  window.sessionStorage.setItem("stats", stats);

  window.sessionStorage.setItem("versionHistory", "[]");
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
  // setGridSize(10);
  // layoutCanvas("A4");
  //
  const { width, height } = pageDimensions[pageSize];
  setDefaults(pageSize);
  layoutSvgCanvas(pageSize, (callFromScript = true));
  buildRulers(svgRoot, width, height);
  applyZoom();
};

onloadInit();
