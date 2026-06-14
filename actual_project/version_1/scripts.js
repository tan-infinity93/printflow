/* ===========================
   CONSTANTS & STATE
=========================== */

const page = document.getElementById("page");
const safeZone = document.getElementById("safeZone");
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
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  C4: { width: 229, height: 324 },
};

/* ===========================
   ZOOM (VISUAL ONLY)
=========================== */

function applyZoom() {
  canvas.style.transform = `scale(${zoomLevel})`;
  canvas.style.transformOrigin = "top left";

  const zoomPercent = Math.round(zoomLevel * 100);
  document.getElementById("zoomLevel").textContent = `Level: ${zoomPercent} %`;
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

page.addEventListener("mousemove", (e) => {
  const rect = page.getBoundingClientRect();

  const xPx = e.clientX - rect.left;
  const yPx = e.clientY - rect.top;

  const pageWidthMm = parseFloat(document.getElementById("xSize").textContent);
  const pageHeightMm = parseFloat(document.getElementById("ySize").textContent);

  const mmPerPxX = pageWidthMm / rect.width;
  const mmPerPxY = pageHeightMm / rect.height;

  const xMm = xPx * mmPerPxX;
  const yMm = yPx * mmPerPxY;

  if (xMm >= 0 && yMm >= 0) {
    xVal.textContent = xMm.toFixed(1);
    yVal.textContent = yMm.toFixed(1);
  }
});

/* ===========================
   GRID & PAGE TYPE
=========================== */

const toggleGrid = () => {
  page.classList.toggle("hide-grid");
};

document.querySelectorAll(".pagetype").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const pageSize = item.textContent.trim();

    const toggleBtn = item
      .closest(".dropdown")
      .querySelector(".dropdown-toggle");
    toggleBtn.textContent = `Page: ${pageSize}`;

    window.sessionStorage.setItem("pageSize", pageSize);
    layoutCanvas(pageSize);
  });
});

const setGridSize = (gridSize) => {
  document
    .querySelector(".grid")
    .style.setProperty("--grid-size", `${gridSize}mm`);

  const grid = document.querySelector(".grid");
  grid.style.setProperty("--grid-size", `${gridSize * PX_PER_MM}px`);

  console.log(`${gridSize}mmGrid`);

  for (let i = 0; i < gridSizes.length; i++) {
    if (gridSizes[i] === gridSize) {
      document.getElementById(`${gridSizes[i]}mmGrid`).classList.add("active");
    } else {
      document
        .getElementById(`${gridSizes[i]}mmGrid`)
        .classList.remove("active");
    }
  }

  // 🔁 re-render rulers to stay in sync
  const pageType = document.getElementById("pageType").textContent;
  const { width, height } = pageDimensions[pageType];

  // Set same in localStorage for future use in renderRulers fx via layoutCanvas
  window.sessionStorage.setItem("gridSize", gridSize);

  renderRulers(width, height, gridSize);
};

/* ===========================
   BOX HELPERS
=========================== */

function pxToMm(px, axis = "x") {
  const rect = page.getBoundingClientRect();
  const pageMm =
    axis === "x"
      ? parseFloat(document.getElementById("xSize").textContent)
      : parseFloat(document.getElementById("ySize").textContent);

  const pagePx = axis === "x" ? rect.width : rect.height;
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

const addTextBox = (
  role,
  x = 20,
  y = 20,
  w = 40,
  textContent = "Sample Text",
) => {
  const textBox = document.createElement("div");

  textBox.classList.add("text-box", "design-object");
  textBox.contentEditable = "false";
  textBox.innerText = textContent;
  textBox.id = crypto.randomUUID();
  textBox.role = role;
  textBox.dataset.leftMm = x;
  textBox.dataset.topMm = y;
  textBox.dataset.widthMm = w;

  const pageSize = window.sessionStorage.getItem("pageSize");
  const pageWidthMm = pageDimensions[pageSize].width;
  const pagePaddingMm = 5 * 0;

  textBox.dataset.maxWidthMm = pageWidthMm - pagePaddingMm - x;
  textBox.style.maxWidth = `${textBox.dataset.maxWidthMm}mm`;

  // Apply positioning + width:
  updateBoxPosition(textBox);
  textBox.style.width = `${w}mm`;
  enableBoxInteractions(textBox, "textBox");

  page.appendChild(textBox);
};

/* ===========================
   ADD IMAGE BOX
=========================== */

function triggerImageBox() {
  document.getElementById("imageInput").click();
}

document.getElementById("imageInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => addImageBox(reader.result);
  reader.readAsDataURL(file);

  e.target.value = "";
});

function addImageBox(src) {
  const imageBox = document.createElement("div");
  // imageBox.className = "image-box";

  imageBox.classList.add("image-box", "design-object");

  imageBox.dataset.leftMm = 30;
  imageBox.dataset.topMm = 30;
  imageBox.dataset.widthMm = 30;
  imageBox.dataset.heightMm = 30;
  imageBox.id = crypto.randomUUID();

  const img = document.createElement("img");
  img.src = src;
  img.draggable = false;

  imageBox.appendChild(img);
  addResizeHandle(imageBox);
  updateBoxPosition(imageBox);

  enableBoxInteractions(imageBox, "imageBox");
  page.appendChild(imageBox);
}

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

  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;
  contextMenu.style.position = "absolute";
  contextMenu.style.zIndex = 9999;
  contextMenu.classList.remove("hidden");
  contextMenu.style.display = "block";

  const contextOptionsDiv = document.getElementById("contextOptions");
  let contextOptionsHTML;

  if (elementType == "textBox") {
    contextOptionsHTML = `
      <div class="input-group font-size3x input-group-sm">
        <span class="input-group-text">Font Size: </span>
        <input
            type="number"
            class="form-control rounded-start"
            id="${target.id}-fontSize"
            min="8"
            max="20"
            step="1"
            value="12"
            inputmode="numeric"
            onchange="changeTextBoxFontSize('${target.id}')"
        />
        <span class="input-group-text">pt</span>
      </div>
      <div class="input-group font-size3x input-group-sm">
        <span class="input-group-text">Font Bold: </span>
        <label class="circular-switch">
            <input type="checkbox" id="boldFontToggle" onchange="toggleBoldFont('${target.id}')">
            <span class="slider"></span>
        </label>
      </div>
      <div class="input-group font-size3x input-group-sm">
        <span class="input-group-text">Font Italic: </span>
        <label class="circular-switch">
            <input type="checkbox" id="italicFontToggle" onchange="toggleItalicFont('${target.id}')">
            <span class="slider"></span>
        </label>
      </div>
    `;
  }
  contextOptionsDiv.innerHTML = contextOptionsHTML;

  window.sessionStorage.setItem("divToBeClosed", target.id);
};

document.addEventListener("click", () => {
  hideContextMenu();
});

const hideContextMenu = () => {
  contextMenu.classList.add("hidden");
  activeElement = null;
};

// TextBox:

const changeTextBoxFontSize = (divID) => {
  let fontSize = document.getElementById(`${divID}-fontSize`).value;
  // Use pt for print correctness
  let div = document.getElementById(divID);
  // console.log(div.style.fontSize);
  div.style.fontSize = `${fontSize}pt`;
};

const toggleBoldFont = (divID) => {
  // console.log(divID);
  document.getElementById(divID).classList.toggle("text-box-bold");
};

const toggleItalicFont = (divID) => {
  // console.log(divID);
  document.getElementById(divID).classList.toggle("text-box-italic");
};

// Drag Function:

function enableBoxInteractions(box, elementType) {
  let isDragging = false;
  let startX, startY;
  let startLeftMm, startTopMm;

  box.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    enterEditMode(box);

    // if (elementType == "textBox") {
    //   box.contentEditable = "true";
    //   box.focus();
    // }
  });

  if (elementType == "textBox") {
    box.addEventListener("blur", () => {
      box.contentEditable = "false";
    });
  }

  box.addEventListener("mousedown", (e) => {
    if (box.classList.contains("editing") || box.classList.contains("locked"))
      return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    startLeftMm = parseFloat(box.dataset.leftMm);
    startTopMm = parseFloat(box.dataset.topMm);

    // alert("in fx enableBoxInteractions line 392");

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  /* ---------- RIGHT CLICK → CONTEXT MENU ---------- */
  box.addEventListener("contextmenu", (e) => {
    e.preventDefault();

    if (box.classList.contains("locked")) return;

    const target = e.target.closest(".design-object");
    if (!target) {
      hideContextMenu();
      return;
    }
    let activeElement = null;
    activeElement = target;
    console.log(target);
    showContextMenu(target, elementType);
  });

  function onMove(e) {
    if (!isDragging) return;

    const dxMm = pxToMm(e.clientX - startX, "x");
    const dyMm = pxToMm(e.clientY - startY, "y");

    let updatedX = Math.max(0, startLeftMm + dxMm);
    let updatedY = Math.max(0, startTopMm + dyMm);

    // alert("in fx onMove line 424");
    // console.log(`updatedX: ${updatedX}, updatedY: ${updatedY}`);
    // Check this coordinate points once:
    if (updatedX < 10.0 || updatedY < 10.0) {
      let axis = "";
      let coordinate = 0.0;
      if (updatedX < 10.0) {
        axis = "X";
        coordinate = updatedX;
      }
      if (updatedY < 10.0) {
        axis = "Y";
        coordinate = updatedY;
      }

      // First highlight the zone as Yellow / Red and then remove same:
      // safeZone.style.backgroundColor = "#ff0000";
      // setTimeout(() => {
      //   safeZone.style.backgroundColor = "#ffffff";
      // }, 2000);

      showToast(
        `Crossing Safe Zone at Axis: ${axis} and Coordinate: ${coordinate}, Printing will be affected...!!!`,
        "warning",
      );
    }

    box.dataset.leftMm = updatedX;
    box.dataset.topMm = updatedY;

    updateBoxPosition(box);
  }

  function onUp() {
    isDragging = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    resolveVerticalCollisions(box);
  }
}

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

function addResizeHandle(box) {
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
}

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
  page.removeChild(currentElement);
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

async function exportAsPDF(fileName) {
  const page = document.getElementById("page");

  // Ensure 1:1 scale
  const prevTransform = page.style.transform;
  page.style.transform = "none";

  // 1. Enter export mode
  document.body.classList.add("export-mode");

  // 2. Wait one frame so styles apply
  await new Promise((r) => requestAnimationFrame(r));

  // Reset Text gap lines:

  const canvas = await html2canvas(page, {
    scale: 2, // print quality, later make same as user config via UI / UX
    backgroundColor: "#fff",
    useCORS: true,
  });

  // 4. Exit export mode
  document.body.classList.remove("export-mode");

  page.style.transform = prevTransform;

  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;

  // Set Page Size below:
  const pdf = new jsPDF("portrait", "mm", "a4");

  pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
  // pdf.save("print.pdf");

  showToast("PDF export in process...", "success");

  setTimeout(() => {
    pdf.save(fileName);
  }, 3000);
}

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
  page.innerHTML = `
    <div class="safe-zone"></div>
    <div class="grid" id="pageGrid"></div>
    <input
        type="file"
        id="imageInput"
        accept="image/*"
        hidden
    />
  `;

  showToast("Canvas Grid is Reset...!!!");
  bootstrap.Modal.getInstance(
    document.getElementById("resetCanvasModal"),
  ).hide();
};

const toggleSafeZone = () => {
  safeZone.classList.toggle("safe-zone");
};

const changeSafeZoneSize = () => {
  const safeZoneMm = document.getElementById("safeZoneMm").value;
  // alert(safeZoneMm);
  const safeZone = document.getElementById("safeZone");
  safeZone.style.setProperty("--inset", `${safeZoneMm}mm`);
};

/* ===========================
   INIT
=========================== */

function onloadInit() {
  setGridSize(10);
  layoutCanvas("A4");
  applyZoom();
}

onloadInit();
