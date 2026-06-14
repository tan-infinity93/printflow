/*
  Constants Definition:
*/

const SVG_NS = "http://www.w3.org/2000/svg";
const RULER_SIZE_MM = 10; // thickness of rulers
// get this from sessionStorage:
const pageWidthMm = 210;
const pageHeightMm = 297;
const PAGE_OFFSET_PX = 28;

const setGridSize = (gridSize) => {
  // console.log(gridSize);

  let pageDimensions = {
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
    C4: { width: 229, height: 324 },
  };

  const pageSize = window.sessionStorage.getItem("pageSize");
  // console.log(pageSize);
  const { width, height } = pageDimensions[pageSize];
  const svgRoot = document.getElementById("workspace");

  window.sessionStorage.setItem("gridSize", `${gridSize}`);
  setGridBoxes(width, height, svgRoot);
};

const buildRulers = (svgRoot, pageWidthMm, pageHeightMm, rulerSizeMm = 10) => {
  let rulerLayer = svgRoot.querySelector("#rulers-layer");
  if (!rulerLayer) {
    rulerLayer = document.createElementNS(SVG_NS, "g");
    rulerLayer.setAttribute("id", "rulers-layer");
    svgRoot.appendChild(rulerLayer);
  }
  rulerLayer.innerHTML = "";

  // --- TOP RULER ---
  for (let x = 0; x <= pageWidthMm; x += 1) {
    const line = document.createElementNS(SVG_NS, "line");
    // line.setAttribute("x1", x + rulerSizeMm);
    // line.setAttribute("x2", x + rulerSizeMm);
    // line.setAttribute("y1", 0); // top of ruler

    line.setAttribute("x1", x + 10);
    line.setAttribute("x2", x + 10);
    line.setAttribute("y1", 0);

    line.setAttribute("y2", x % 10 === 0 ? 6 : x % 5 === 0 ? 4 : 3); // tick length
    line.setAttribute("stroke", "#555");
    line.setAttribute("stroke-width", "0.3");
    rulerLayer.appendChild(line);

    // Numbers every 10mm
    if (x % 10 === 0) {
      // console.log(x);
      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", x + rulerSizeMm);
      label.setAttribute("y", rulerSizeMm - 1); // inside top ruler
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "3");
      label.setAttribute("fill", "#444");
      label.textContent = x;
      rulerLayer.appendChild(label);
    }
  }

  // --- LEFT RULER ---
  for (let y = 0; y <= pageHeightMm; y += 1) {
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", 0);
    line.setAttribute("y1", y + 10);
    line.setAttribute("y2", y + 10);
    line.setAttribute("x2", y % 10 === 0 ? 6 : y % 5 === 0 ? 4 : 3); // tick length
    line.setAttribute("stroke", "#555");
    line.setAttribute("stroke-width", "0.3");
    rulerLayer.appendChild(line);

    // Numbers every 10mm
    if (y % 10 === 0) {
      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", rulerSizeMm - 1); // inside left ruler
      label.setAttribute("y", y + rulerSizeMm + 1);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("font-size", "3");
      label.setAttribute("fill", "#444");
      label.textContent = y;
      rulerLayer.appendChild(label);
    }
  }
};

const setSafeZone = (width, height, svgPage, safeMarginMm = 10) => {
  // Add safezone as an svg as well instead of a div earlier:

  let safeZoneExisting = document.getElementById("safeZone");
  // safeZone.replaceChildren();

  const safeZone = document.createElementNS(SVG_NS, "rect");

  const pageGroup = document.getElementById("pageGroup");

  if (safeZoneExisting) {
    safeZoneExisting.remove();
  }

  // const safeMarginMm = 10;

  safeZone.setAttribute("id", "safeZone");
  safeZone.setAttribute("x", safeMarginMm);
  safeZone.setAttribute("y", safeMarginMm);
  safeZone.setAttribute("width", width - safeMarginMm * 2);
  safeZone.setAttribute("height", height - safeMarginMm * 2);
  safeZone.setAttribute("fill", "none");
  safeZone.setAttribute("stroke", "#999");
  safeZone.setAttribute("stroke-dasharray", "0.5 0.5");

  svgPage.appendChild(safeZone);

  window.sessionStorage.setItem("marginSize", `${safeMarginMm - 10}`);
};

const setGridBoxes = (pageW, pageH, svgRoot) => {
  const NS = "http://www.w3.org/2000/svg";
  const gridSize = Number(sessionStorage.getItem("gridSize")) || 10;

  const gridLayer = svgRoot.querySelector("#grid-layer");
  if (!gridLayer) return;

  // defs
  let defs = svgRoot.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(NS, "defs");
    svgRoot.prepend(defs);
  }
  defs.innerHTML = "";

  const pattern = document.createElementNS(NS, "pattern");
  pattern.setAttribute("id", "gridPattern");
  pattern.setAttribute("width", gridSize);
  pattern.setAttribute("height", gridSize);
  pattern.setAttribute("patternUnits", "userSpaceOnUse");

  const path = document.createElementNS(NS, "path");
  path.setAttribute("id", "gridPath");
  path.setAttribute("d", `M ${gridSize} 0 L 0 0 L 0 ${gridSize}`);
  // path.setAttribute("stroke", "#ccc");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "0.4");
  path.setAttribute("fill", "none");

  pattern.appendChild(path);
  defs.appendChild(pattern);

  let gridRect = gridLayer.querySelector("#gridOverlay");
  if (!gridRect) {
    gridRect = document.createElementNS(NS, "rect");
    gridRect.setAttribute("id", "gridOverlay");
    gridLayer.appendChild(gridRect);
  }

  gridRect.setAttribute("x", 0);
  gridRect.setAttribute("y", 0);
  gridRect.setAttribute("width", pageW);
  gridRect.setAttribute("height", pageH);
  gridRect.setAttribute("fill", "url(#gridPattern)");
  gridRect.setAttribute("pointer-events", "none");
};

const layoutSvgCanvas = (pageSize, callFromScript = true) => {
  console.log(pageSize);
  const { width, height } = pageDimensions[pageSize];

  document.getElementById("xSize").textContent = width;
  document.getElementById("ySize").textContent = height;

  const svgRoot = document.getElementById("workspace");

  // 🔥 This clears everything
  svgRoot.replaceChildren();

  // --- SVG sizing ---
  svgRoot.setAttribute("width", `${width}mm`);
  svgRoot.setAttribute("height", `${height}mm`);
  svgRoot.setAttribute("viewBox", `0 0 ${width + 15} ${height + 15}`);

  // --- RULERS ---
  const rulersLayer = document.createElementNS(SVG_NS, "g");
  rulersLayer.setAttribute("id", "rulers-layer");
  svgRoot.appendChild(rulersLayer);

  // --- PAGE GROUP ---
  const pageGroup = document.createElementNS(SVG_NS, "g");
  pageGroup.setAttribute("id", "pageGroup");
  // Ensure pageGroup is translated by RULER_SIZE_MM
  pageGroup.setAttribute(
    "transform",
    `translate(${RULER_SIZE_MM}, ${RULER_SIZE_MM})`,
  );
  svgRoot.appendChild(pageGroup);

  // --- PAGE RECT ---
  const pageRect = document.createElementNS(SVG_NS, "rect");
  pageRect.setAttribute("id", "pageRect");
  pageRect.setAttribute("width", width);
  pageRect.setAttribute("height", height);
  pageRect.setAttribute("fill", "white");
  pageRect.setAttribute("stroke", "#ccc");
  pageGroup.appendChild(pageRect);

  // --- GRID LAYER ---
  const gridLayer = document.createElementNS(SVG_NS, "g");
  gridLayer.setAttribute("id", "grid-layer");
  pageGroup.appendChild(gridLayer);

  // --- SAFE ZONE ---
  const safeZone = document.createElementNS(SVG_NS, "rect");
  safeZone.setAttribute("id", "safeZone");
  pageGroup.appendChild(safeZone);

  // --- CONTENT ---
  const contentLayer = document.createElementNS(SVG_NS, "g");
  contentLayer.setAttribute("id", "content-layer");
  pageGroup.appendChild(contentLayer);

  // ✅ NOW everything exists
  setSafeZone(width, height, pageGroup);
  setGridBoxes(width, height, svgRoot);

  if (callFromScript == false) {
    buildRulers(svgRoot, width, height);
  }
};

const hideLeftHandMenuOptions = (menuName) => {
  // console.log(menuName);
  let menuNames;

  if (menuName == "all-left-hand-side") {
    menuNames = [
      "page-setup-and-coordinates",
      "pointer-coordinates",
      "document-preset",
      "document-elements",
      "zoom-controls",
      "grid-controls",
    ];
  } else {
    menuNames = [menuName];
  }

  // console.log(menuNames);

  menuNames.forEach((menuName) => {
    let menuDiv = document.getElementById(menuName);
    let classList = menuDiv.classList;

    if (classList.contains("hidden") == true) {
      menuDiv.classList.remove("hidden");
      window.sessionStorage.setItem(`${menuName}-display`, "1");
    } else {
      menuDiv.classList.add("hidden");
      window.sessionStorage.setItem(`${menuName}-display`, "0");
    }
  });
};
