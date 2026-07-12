/**
 * inspector3d.js — §12 3D Canvas Inspector (WebGL, Three.js lazy-loaded)
 *
 * "Firefox Tilt" style: every SVG element extruded into a stacked box by
 * hierarchy depth and z-order, orbitable in realtime.
 *
 * Scope: visualises ONLY the #workspace SVG document (page groups + content
 * layers). The surrounding app DOM is never walked or rendered.
 *
 * RENDERING MODEL (per request §8): instead of a full-screen overlay, the
 * inspector hides the left + right side menus, expands the middle column to
 * the full 12-column width, hides the 2D canvas, and renders the WebGL 3D
 * view IN PLACE inside the middle column. The "Show Layers" button toggles to
 * "Hide Layers" and restores the side menus on close.
 *
 * Three.js is LAZY-LOADED on first open (does NOT appear in the static script
 * list — keeps normal page load light).
 */

/* ============================================================
   CONSTANTS
   ============================================================ */

const THREE_JS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.158.0/three.min.js";
const EXTRUDE_MM   = 1.5;    // uniform thickness of EVERY card (§1)
const Z_STEP_MM    = 8;      // gap between layers in mm (§1 — was 4)
const I3D_PAGE_GAP_MM = 40;  // gap between pages laid side-by-side in 3D
const MESH_CAP     = 2000;   // perf guard: collapse deep nodes beyond this

// Background presets for the 3D view (§4) — selectable via overlay swatches.
const I3D_BACKGROUNDS = {
  black: 0x12121f,
  grey:  0xced4da,
  white: 0xffffff,
};

// Colour by element type (matches app accent palette) — default/legend fallback.
const TYPE_COLOURS = {
  textBox:   0x0d6efd,
  imageBox:  0x6f42c1,
  tableBox:  0x198754,
  shapeBox:  0xfd7e14,
  chrome:    0xadb5bd,
  unknown:   0x6c757d,
};

// §14 Per-background palettes so cards stay legible on white / grey / black.
//  - dark bg  → brighter, higher-glow colours, white edges, light plate
//  - light bg → deeper, saturated colours, dark edges, contrasting plate
const I3D_PALETTES = {
  dark: {
    colors: { textBox: 0x4d94ff, imageBox: 0xb083f0, tableBox: 0x3ddc84, shapeBox: 0xffa94d, chrome: 0xadb5bd, unknown: 0xced4da },
    edge: 0xffffff, edgeOpacity: 0.35, emissive: 0.18,
    // Lighter grid so it reads on a black background.
    gridCenter: 0x7d8aa3, gridLine: 0x4a5670, gridOpacity: 0.55,
  },
  light: {
    colors: { textBox: 0x0b5ed7, imageBox: 0x59359a, tableBox: 0x146c43, shapeBox: 0xca5a0a, chrome: 0x6c757d, unknown: 0x343a40 },
    edge: 0x1b2733, edgeOpacity: 0.5, emissive: 0.04,
    // Darker grid so it reads on white / grey.
    gridCenter: 0x6c757d, gridLine: 0x9aa3ad, gridOpacity: 0.6,
  },
};
// Page plate colour tuned to contrast with each specific background.
const I3D_PLATES = { black: 0xe9ecef, grey: 0xffffff, white: 0xdee2e6 };

const _activePalette = () => {
  const base  = (_viewBg === "black") ? I3D_PALETTES.dark : I3D_PALETTES.light;
  const plate = I3D_PLATES[_viewBg] != null ? I3D_PLATES[_viewBg] : 0xe9ecef;
  return {
    colors: base.colors, edge: base.edge, edgeOpacity: base.edgeOpacity, emissive: base.emissive, plate,
    gridCenter: base.gridCenter, gridLine: base.gridLine, gridOpacity: base.gridOpacity,
  };
};

// Classes / attributes that identify chrome (excluded from export pipelines)
const CHROME_CLASSES = [
  "img-resize-handle", "svg-table-grip", "page-watermark",
  "text-highlight",    "cell-edit-fo",   "align-guide",
  "label-guide",       "lock-indicator",
];

/* ============================================================
   STATE
   ============================================================ */

let _overlayOpen    = false;
let _renderer       = null;
let _scene          = null;
let _camera         = null;
let _rafId          = null;
let _needsRender    = false;
let _observer       = null;
let _meshMap        = new Map(); // mesh.uuid → { svgEl, mesh }
let _selectedMesh   = null;
let _showChrome     = false;
let _onResize       = null;

// View mode: "layers" = exploded stack; "space" = same scene + X/Y/Z axes,
// bounding box and floor grid (the "3D coordinate space" view, §2/§3).
let _viewMode       = (typeof localStorage !== "undefined" && localStorage.getItem("inspector3dMode")) || "layers";
let _focusPage      = 1; // page the page-nav arrows are centred on (§5)
let _viewBg         = (typeof localStorage !== "undefined" && localStorage.getItem("inspector3dBg")) || "black"; // §4

// Orbital camera state
let _spherical = { theta: 0.4, phi: 1.0, radius: 500 };
let _panOffset = { x: 0, y: 0 };
let _dragState  = null;

/* ============================================================
   LAZY THREE.JS LOADER
   ============================================================ */

let _threePromise = null;
const _loadThree = () => {
  if (_threePromise) return _threePromise;
  if (window.THREE) { _threePromise = Promise.resolve(); return _threePromise; }
  _threePromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = THREE_JS_CDN;
    s.onload = () => resolve();
    s.onerror = () => {
      _threePromise = null;
      reject(new Error("Three.js failed to load"));
    };
    document.head.appendChild(s);
  });
  return _threePromise;
};

/* ============================================================
   ENTRY / EXIT  (toggled by the "Show Layers" button)
   ============================================================ */

const toggle3dInspector = async () => {
  if (_overlayOpen) {
    _closeInspector();
  } else {
    await _openInspector();
  }
};

const _openInspector = async () => {
  if (_overlayOpen) return;

  // Test WebGL availability up front
  const testCanvas = document.createElement("canvas");
  const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
  if (!gl) {
    showToast("3D inspector needs WebGL — not available in this browser", "danger");
    return;
  }

  try {
    await _loadThree();
  } catch (err) {
    showToast("3D inspector needs WebGL (Three.js could not load)", "danger");
    return;
  }
  const THREE = window.THREE;
  if (!THREE) {
    showToast("3D inspector failed to initialise (Three.js unavailable)", "danger");
    return;
  }

  _overlayOpen = true;
  window._inspector3dOpen = true; // canvas keyboard handler early-returns while open

  // Build the full-area 3D view that fills everything below the navbar (§8).
  // The 2D SVG canvas stays RENDERED behind it (NOT display:none) — hiding it
  // made getBBox() return zeros, which is why elements were invisible (§7).
  const container = _createInlineDOM();
  document.body.appendChild(container);

  // 3. Init Three.js renderer sized to the container's canvas
  const canvas3d = document.getElementById("inspector3dCanvas");
  _renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true, alpha: true });
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  _renderer.setClearColor(I3D_BACKGROUNDS[_viewBg] || I3D_BACKGROUNDS.black, 1);
  _resizeRenderer();

  // Camera
  _camera = new THREE.PerspectiveCamera(
    45,
    (canvas3d.clientWidth || 1) / (canvas3d.clientHeight || 1),
    1, 8000,
  );
  _resetCamera();

  // Scene + lights are (re)built inside _buildScene
  _buildScene(THREE);

  // Controls + live sync + keyboard
  _attachControls(canvas3d, THREE);
  _startObserver(THREE);
  document.addEventListener("keydown", _onInspectorKey);

  // Resize handler (kept so we can remove it on close)
  _onResize = () => {
    if (!_overlayOpen) return;
    _resizeRenderer();
    _needsRender = true;
  };
  window.addEventListener("resize", _onResize);

  // 4. Flip the button to "Hide Layers"
  _setLayersButton(true);

  _needsRender = true;
  _startRaf();

  // Layout may not be flushed when the container is first inserted; re-size
  // the renderer/camera once the browser has laid the flex container out.
  requestAnimationFrame(() => {
    if (!_overlayOpen) return;
    _resizeRenderer();
    _needsRender = true;
  });

  showToast("3D layers view — drag to orbit, scroll to zoom, Esc to exit", "info");
};

const _closeInspector = () => {
  if (!_overlayOpen) return;
  _overlayOpen = false;
  window._inspector3dOpen = false;

  // Detach listeners/observer now — not needed during the exit animation.
  if (_observer) { _observer.disconnect(); _observer = null; }
  if (_onResize) { window.removeEventListener("resize", _onResize); _onResize = null; }
  document.removeEventListener("keydown", _onInspectorKey);
  _setLayersButton(false);

  // Capture THIS session's resources so a fast re-open can't clobber them.
  const container = document.getElementById("inspector3dContainer");
  const renderer  = _renderer;
  const scene     = _scene;
  const rafId     = _rafId;
  _renderer = null; _scene = null; _camera = null; _rafId = null; _selectedMesh = null;

  // Free the ids immediately so a re-open builds a clean, non-colliding DOM.
  if (container) {
    container.id = "";
    const c3d = container.querySelector("#inspector3dCanvas");
    if (c3d) c3d.id = "";
    container.classList.remove("i3d-anim");
    container.classList.add("i3d-closing"); // §15 fade + zoom-out
  }

  // Tear down after the exit animation has played (matches the 0.3s i3dExit).
  setTimeout(() => {
    if (rafId) cancelAnimationFrame(rafId);
    _disposeScene(scene);
    if (renderer) renderer.dispose();
    if (container) container.remove();
  }, 320);
};

/* ============================================================
   SHOW/HIDE LAYERS BUTTON STATE
   ============================================================ */

const _setLayersButton = (active) => {
  const btn = document.getElementById("showLayersBtn");
  if (!btn) return;
  const label = btn.querySelector(".show-layers-label");
  const icon  = btn.querySelector("i");
  if (active) {
    btn.title = "Hide Layers";
    btn.classList.add("layers-active");
    if (label) label.textContent = "Hide Layers";
    if (icon)  icon.className = "fa-solid fa-xmark";
  } else {
    btn.title = "Show Layers";
    btn.classList.remove("layers-active");
    if (label) label.textContent = "Show Layers";
    if (icon)  icon.className = "fa-solid fa-layer-group";
  }
};

/* ============================================================
   IN-PLACE 3D CONTAINER DOM
   ============================================================ */

const _createInlineDOM = () => {
  // Sit the black view directly below the navbar and fill the rest of the
  // viewport (§8). Undo / Redo / Hide-Layers float as an overlay (§6).
  const nav = document.querySelector("nav.navbar");
  const navH = nav ? Math.round(nav.getBoundingClientRect().height) : 56;
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  _focusPage = 1;

  const div = document.createElement("div");
  div.id = "inspector3dContainer";
  div.className = "i3d-anim"; // §15 fade + slight zoom on entrance
  div.style.cssText = `
    position:fixed; top:${navH}px; left:0; right:0; bottom:0;
    z-index:1040; font-family:'Inter',sans-serif;
    background:${"#" + (I3D_BACKGROUNDS[_viewBg] || I3D_BACKGROUNDS.black).toString(16).padStart(6, "0")};
  `;
  const swatch = (name, color, border) =>
    `<button class="undo-redo-btn i3d-bg-swatch${_viewBg === name ? " i3d-bg-active" : ""}" data-bg="${name}"
       style="pointer-events:auto;background:${color};border:1px solid ${border};"
       onclick="inspector3dSetBg('${name}')" title="${name[0].toUpperCase() + name.slice(1)} background"></button>`;

  div.innerHTML = `
    <!-- Full-bleed WebGL canvas — scene centres in the FULL width (§2) -->
    <canvas id="inspector3dCanvas" style="position:absolute;inset:0;display:block;width:100%;height:100%;"></canvas>

    <!-- Left vertical toolbar overlay: undo/redo, zoom, page nav (§5) -->
    <div style="position:absolute;top:0;left:0;bottom:34px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:14px 18px;z-index:6;pointer-events:none;">
      <button class="undo-redo-btn" style="pointer-events:auto;" onclick="undo()" title="Undo (Ctrl+Z)"><i class="fa-solid fa-rotate-left"></i></button>
      <button class="undo-redo-btn" style="pointer-events:auto;" onclick="redo()" title="Redo (Ctrl+Y)"><i class="fa-solid fa-rotate-right"></i></button>
      <button class="undo-redo-btn" style="pointer-events:auto;" onclick="inspector3dZoomIn()" title="Zoom in"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
      <button class="undo-redo-btn" style="pointer-events:auto;" onclick="inspector3dZoomOut()" title="Zoom out"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
      <button class="undo-redo-btn" style="pointer-events:auto;" onclick="inspector3dPrevPage()" title="Previous page"><i class="fa-solid fa-chevron-left"></i></button>
      <button class="undo-redo-btn" style="pointer-events:auto;" onclick="inspector3dNextPage()" title="Next page"><i class="fa-solid fa-chevron-right"></i></button>
      <span id="inspector3dPageLabel" style="pointer-events:auto;color:#8b949e;font-size:11px;font-weight:600;margin-left:4px;">1/${total}</span>
    </div>

    <!-- Right cluster overlay: hints, show chrome, bg swatches, view mode, hide layers (§3/§4/§6) -->
    <div style="position:absolute;top:0;right:0;display:flex;align-items:center;gap:12px;padding:14px 18px;z-index:6;">
      <span style="color:#58a6ff;font-weight:600;font-size:13px;"><i class="fa-solid fa-cube me-2"></i>3D Layers</span>
      <span style="color:#8b949e;font-size:11px;">Drag:orbit&nbsp;|&nbsp;Scroll:zoom&nbsp;|&nbsp;R:reset&nbsp;|&nbsp;Esc:exit</span>
      <label style="color:#8b949e;font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer;margin:0;">
        <input type="checkbox" id="showChromeCheck" onchange="inspector3dToggleChrome()"> Show chrome
      </label>
      <span style="display:flex;align-items:center;gap:6px;">
        ${swatch("white", "#ffffff", "#adb5bd")}
        ${swatch("grey",  "#ced4da", "#adb5bd")}
        ${swatch("black", "#12121f", "#495057")}
      </span>
      <button id="inspector3dModeBtn" class="undo-redo-btn" onclick="inspector3dToggleMode()" title="${_viewMode === "space" ? "3D Space (axes) — switch to Layers" : "Layers — switch to 3D Space"}">
        <i class="fa-solid ${_viewMode === "space" ? "fa-cube" : "fa-layer-group"}"></i>
      </button>
      <button class="undo-redo-btn" onclick="_closeInspector()" title="Hide Layers (Esc)">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- Info panel floats over the right edge, hidden until an element is picked (§2) -->
    <div id="inspector3dInfo" style="position:absolute;top:60px;right:0;bottom:40px;width:250px;background:rgba(13,17,23,0.96);border-left:1px solid #30363d;padding:12px;overflow-y:auto;font-size:12px;color:#c9d1d9;z-index:5;display:none;border-top-left-radius:8px;border-bottom-left-radius:8px;">
      <p style="color:#8b949e;font-size:11px;">Click any box to inspect the element.</p>
    </div>

    <!-- Footer legend + live zoom level (§5/§6) -->
    <div id="inspector3dLegend" style="position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:16px;padding:6px 22px;background:#0d1117;border-top:1px solid #30363d;z-index:6;">
      <span id="inspector3dLegendSwatches" style="display:flex;gap:16px;">${_legendHTML()}</span>
      <span id="inspector3dZoomLabel" style="margin-left:auto;color:#58a6ff;font-size:11px;font-weight:600;"><i class="fa-solid fa-magnifying-glass me-1"></i>100%</span>
    </div>
  `;
  return div;
};

// Footer legend swatches, coloured to match the ACTIVE (background-tuned) palette.
const _legendHTML = () => {
  const cols = _activePalette().colors;
  return [["Text","textBox"],["Image","imageBox"],["Table","tableBox"],["Shape","shapeBox"],["Unknown","unknown"]]
    .map(([label, key]) => {
      const hex = "#" + (cols[key] || cols.unknown).toString(16).padStart(6, "0");
      return `<span style="font-size:11px;color:#8b949e;display:flex;align-items:center;gap:4px;">
        <span style="display:inline-block;width:10px;height:10px;background:${hex};border-radius:2px;"></span>${label}
      </span>`;
    }).join("");
};

const _refreshLegend = () => {
  const el = document.getElementById("inspector3dLegendSwatches");
  if (el) el.innerHTML = _legendHTML();
};

const _resizeRenderer = () => {
  const canvas3d = document.getElementById("inspector3dCanvas");
  if (!canvas3d || !_renderer) return;
  const w = canvas3d.clientWidth  || 800;
  const h = canvas3d.clientHeight || 600;
  _renderer.setSize(w, h, false);
  if (_camera) {
    _camera.aspect = w / h;
    _camera.updateProjectionMatrix();
  }
};

/* ============================================================
   SCENE CONSTRUCTION  (the core SVG → 3D mapping)
   ============================================================ */

const _pageDims = () => {
  const pageSize = window.sessionStorage.getItem("pageSize") || "A4";
  const dims = (typeof pageDimensions !== "undefined")
    ? pageDimensions
    : { A4: { width: 210, height: 297 } };
  return dims[pageSize] || { width: 210, height: 297 };
};

const _buildScene = (THREE) => {
  _disposeScene();
  _meshMap.clear();
  _selectedMesh = null;
  _scene = new THREE.Scene();

  // Lights
  const ambient  = new THREE.AmbientLight(0xffffff, 0.65);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(200, 400, 300);
  _scene.add(ambient, dirLight);

  const { width: pgW, height: pgH } = _pageDims();
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;

  let meshCount = 0;
  const pal = _activePalette(); // §14 plate colour tuned to the background

  for (let p = 1; p <= total; p++) {
    const pageOffsetX = (p - 1) * (pgW + I3D_PAGE_GAP_MM);

    // Base plate
    const plateGeo  = new THREE.BoxGeometry(pgW, pgH, 0.5);
    const plateMat  = new THREE.MeshLambertMaterial({ color: pal.plate, transparent: true, opacity: 0.92 });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.set(pageOffsetX + pgW / 2, pgH / 2, -0.25);
    _scene.add(plateMesh);

    // Safe-zone frame (translucent red, §12.8 QA framing)
    const szGeo  = new THREE.BoxGeometry(pgW - 20, pgH - 20, 0.3);
    const szMat  = new THREE.MeshLambertMaterial({ color: 0xff4444, transparent: true, opacity: 0.08 });
    const szMesh = new THREE.Mesh(szGeo, szMat);
    szMesh.position.set(pageOffsetX + pgW / 2, pgH / 2, 0.6);
    _scene.add(szMesh);

    const cl = document.getElementById(`content-layer-${p}`);
    if (!cl) continue;

    // Paint-order counter (DOM order == SVG paint order). Each TOP-LEVEL
    // element gets its own layer with a clear air gap, so overlapping elements
    // separate visibly, like Firefox's 3D view (§7).
    let paintIndex = 0;

    // Render one extruded card for an SVG element/group.
    //   node       — the SVG element to box
    //   z          — layer depth (mm)
    //   extrude    — box thickness (mm)
    //   typeKey    — colour key (textBox/imageBox/tableBox/shapeBox/chrome)
    //   depth      — nesting level (for the info panel)
    //   isChrome   — translucent ghost styling
    //   contextEl  — element whose context menu opens on double-click
    const renderCard = (node, z, extrude, typeKey, depth, isChrome, contextEl, order) => {
      if (meshCount >= MESH_CAP) return;
      let bbox;
      try { bbox = node.getBBox(); } catch (_) { return; }
      if (!bbox || bbox.width === 0 || bbox.height === 0) return;

      // Accumulate ancestor translate transforms up to (not including) the layer
      let tx = 0, ty = 0;
      let ancestor = node;
      while (ancestor && ancestor !== cl) {
        const t = (typeof _getTranslate === "function") ? _getTranslate(ancestor) : { x: 0, y: 0 };
        tx += t.x; ty += t.y;
        ancestor = ancestor.parentElement;
      }

      const w  = Math.max(0.5, bbox.width);
      const h  = Math.max(0.5, bbox.height);
      const cx = tx + bbox.x + w / 2;
      const cy = ty + bbox.y + h / 2;

      // §14 Colours, edge colour and glow adapt to the chosen background.
      const pal   = _activePalette();
      const color = pal.colors[typeKey] || pal.colors.unknown;

      // §1 Real elements are OPAQUE; only chrome ghosts stay translucent.
      const geo  = new THREE.BoxGeometry(w, h, extrude);
      const mat  = new THREE.MeshLambertMaterial({
        color,
        transparent: isChrome,
        opacity: isChrome ? 0.25 : 1.0,
        emissive: color,
        emissiveIntensity: isChrome ? 0 : pal.emissive,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pageOffsetX + cx, pgH - cy, z); // SVG y-down → Three y-up
      mesh.userData = { svgEl: node, page: p, depth, siblingIdx: order || 0, elType: typeKey, contextEl: contextEl || node };

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: pal.edge, transparent: true, opacity: pal.edgeOpacity }),
      );
      mesh.add(edges);

      _scene.add(mesh);
      _meshMap.set(mesh.uuid, { svgEl: node, mesh });
      meshCount++;
    };

    Array.from(cl.children).forEach((node) => {
      if (!node.tagName) return;
      const isChrome = CHROME_CLASSES.some((c) => node.classList && node.classList.contains(c));
      if (isChrome && !_showChrome) return;

      paintIndex += 1;
      const z = paintIndex * Z_STEP_MM;
      const elType  = node.getAttribute ? node.getAttribute("elementType") : null;
      const typeKey = elType || (isChrome ? "chrome" : "unknown");

      if (elType === "tableBox") {
        // §1 A table is ONE layer: render every cell coplanar at the table's z
        // (cells tile the table, so they never overlap → no z-fighting). The
        // table container box itself is not drawn (the cells represent it).
        const cells = Array.from(node.children).filter((ch) => ch.tagName === "g");
        if (cells.length) {
          cells.forEach((cell, ci) => renderCard(cell, z, EXTRUDE_MM, "tableBox", 2, false, node, ci));
        } else {
          renderCard(node, z, EXTRUDE_MM, "tableBox", 1, false, node, paintIndex);
        }
      } else {
        // Text / image / shape / unknown → a single card (no inner-primitive
        // double box).
        renderCard(node, z, EXTRUDE_MM, typeKey, 1, isChrome, node, paintIndex);
      }
    });
  }

  // §2/§3 "3D space" mode — add X/Y/Z axes, a bounding box and a floor grid.
  if (_viewMode === "space") {
    _buildSpaceHelpers(THREE, pgW, pgH, total);
  }

  if (meshCount >= MESH_CAP) {
    showToast("3D view: element cap reached — deep nodes collapsed", "info");
  }

  // Selection is reset on rebuild → hide the (now-stale) info panel.
  const ip = document.getElementById("inspector3dInfo");
  if (ip) ip.style.display = "none";

  _needsRender = true;
};

/**
 * _buildSpaceHelpers — colored X/Y/Z axes (red/green/blue), a wireframe
 * bounding box around the whole render, and a faint floor grid on the page
 * plane. Built from Three.js helpers so they dispose cleanly via _disposeScene.
 */
const _buildSpaceHelpers = (THREE, pgW, pgH, total) => {
  const fullW = (total - 1) * (pgW + I3D_PAGE_GAP_MM) + pgW;
  // §6 Extend ALL axes well beyond the content so X and Y reach past the
  // page edges, just like Z reaches past the stack.
  const axisLen = Math.max(fullW, pgH) * 1.3 + 40;

  // X/Y/Z axes from the origin (page bottom-left corner)
  const axes = new THREE.AxesHelper(axisLen);
  if (axes.material) axes.material.depthTest = false;
  axes.renderOrder = 999;
  _scene.add(axes);

  // Faint floor grid on the z = 0 plane (rotate the XZ grid into XY).
  // Grid colours adapt to the background so it stays visible (§14).
  const pal = _activePalette();
  const gridSize = Math.max(fullW, pgH) * 1.4;
  const grid = new THREE.GridHelper(gridSize, 24, pal.gridCenter, pal.gridLine);
  grid.rotation.x = Math.PI / 2;            // lie flat on the page (XY) plane
  grid.position.set(fullW / 2, pgH / 2, -0.5);
  if (grid.material) {
    const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
    mats.forEach((m) => { m.transparent = true; m.opacity = pal.gridOpacity; });
  }
  _scene.add(grid);

  // Bounding box around all element meshes + plates
  try {
    const box = new THREE.Box3();
    _scene.traverse((o) => { if (o.isMesh) box.expandByObject(o); });
    if (!box.isEmpty()) {
      const boxHelper = new THREE.Box3Helper(box, 0x58a6ff);
      if (boxHelper.material) { boxHelper.material.transparent = true; boxHelper.material.opacity = 0.5; }
      _scene.add(boxHelper);
    }
  } catch (_) { /* Box3Helper unavailable — non-critical */ }

  // Small axis tip labels (X/Y/Z) via canvas-texture sprites
  const _label = (text, color, x, y, z) => {
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const ctx = c.getContext("2d");
      ctx.fillStyle = color;
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 32, 32);
      const tex = new THREE.CanvasTexture(c);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      spr.position.set(x, y, z);
      spr.scale.set(12, 12, 1);
      spr.renderOrder = 1000;
      _scene.add(spr);
    } catch (_) { /* sprite labels are decorative — ignore failures */ }
  };
  _label("X", "#ff5a5a", axisLen + 6, 0, 0);
  _label("Y", "#5aff8f", 0, axisLen + 6, 0);
  _label("Z", "#6aa8ff", 0, 0, axisLen + 6);
};

const _disposeScene = (scene = _scene) => {
  if (!scene) return;
  scene.traverse((obj) => {
    if (obj.isMesh || obj.isLine || obj.isLineSegments || obj.isSprite) {
      if (obj.geometry) obj.geometry.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : (obj.material ? [obj.material] : []);
      mats.forEach((m) => {
        if (m.map) m.map.dispose();      // sprite/canvas textures
        m.dispose();
      });
    }
  });
  // NOTE: do not clear _meshMap here — _buildScene clears it explicitly, and a
  // deferred teardown must not wipe a freshly re-opened session's map.
};

/* ============================================================
   RENDER LOOP (on-demand)
   ============================================================ */

const _startRaf = () => {
  const tick = () => {
    _rafId = requestAnimationFrame(tick);
    if (!_needsRender || !_renderer || !_scene || !_camera) return;
    _needsRender = false;

    const { theta, phi, radius } = _spherical;
    const { width: pgW, height: pgH } = _pageDims();
    const cx = _panOffset.x + pgW / 2;
    const cy = _panOffset.y + pgH / 2;

    _camera.position.set(
      cx + radius * Math.sin(phi) * Math.sin(theta),
      cy + radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta),
    );
    _camera.lookAt(cx, cy, 0);

    _renderer.render(_scene, _camera);
  };
  tick();
};

const _resetCamera = () => {
  _spherical = { theta: 0.4, phi: 1.0, radius: 500 };
  _panOffset = { x: 0, y: 0 };
  _needsRender = true;
  _updateZoomLabel();
};

/* ============================================================
   CONTROLS (custom — no OrbitControls dependency)
   ============================================================ */

const _attachControls = (canvas3d, THREE) => {
  canvas3d.addEventListener("contextmenu", (e) => e.preventDefault());

  canvas3d.addEventListener("mousedown", (e) => {
    _dragState = { button: e.button, lastX: e.clientX, lastY: e.clientY, moved: false };
  });

  canvas3d.addEventListener("mousemove", (e) => {
    if (!_dragState) return;
    const dx = e.clientX - _dragState.lastX;
    const dy = e.clientY - _dragState.lastY;
    _dragState.lastX = e.clientX;
    _dragState.lastY = e.clientY;
    if (dx || dy) _dragState.moved = true;

    if (_dragState.button === 0) {
      _spherical.theta -= dx * 0.005;
      _spherical.phi    = Math.max(0.05, Math.min(Math.PI - 0.05, _spherical.phi - dy * 0.005));
    } else {
      _panOffset.x -= dx * (_spherical.radius / 800);
      _panOffset.y += dy * (_spherical.radius / 800);
    }
    _needsRender = true;
  });

  canvas3d.addEventListener("mouseup",    () => { _dragState = null; });
  canvas3d.addEventListener("mouseleave", () => { _dragState = null; });

  canvas3d.addEventListener("wheel", (e) => {
    e.preventDefault();
    _spherical.radius = Math.max(50, Math.min(3000, _spherical.radius + e.deltaY * 0.5));
    _needsRender = true;
    _updateZoomLabel();
  }, { passive: false });

  // Click → raycast select
  canvas3d.addEventListener("click", (e) => {
    const rect = canvas3d.getBoundingClientRect();
    const ndc  = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width)  * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, _camera);
    const meshes = [..._meshMap.values()].map((v) => v.mesh);
    const hits = raycaster.intersectObjects(meshes, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj && !_meshMap.has(obj.uuid)) obj = obj.parent;
      if (obj) _selectMesh(obj);
    }
  });

  // Double-click → exit 3D + open that element's context menu on the 2D canvas.
  // For table cells, contextEl is the parent table group (so the table menu
  // resolves correctly); event.target stays the clicked cell.
  canvas3d.addEventListener("dblclick", () => {
    if (!_selectedMesh) return;
    const data    = _selectedMesh.userData;
    const ctxEl   = data.contextEl || data.svgEl;
    const cellEl  = data.svgEl;
    const elType  = ctxEl && ctxEl.getAttribute ? ctxEl.getAttribute("elementType") : null;
    _closeInspector();
    if (ctxEl && elType && typeof showContextMenu === "function") {
      // Wait out the exit animation (§15) so the menu lands on the clean canvas.
      setTimeout(() => {
        showContextMenu(ctxEl, elType, { preventDefault: () => {}, target: cellEl });
      }, 360);
    }
  });
};

/* ============================================================
   SELECTION & INFO PANEL
   ============================================================ */

const _selectMesh = (mesh) => {
  if (_selectedMesh && _selectedMesh !== mesh && _selectedMesh.material && _selectedMesh.material.emissive) {
    _selectedMesh.material.emissive.set(0x000000);
  }
  _selectedMesh = mesh;
  if (mesh.material && mesh.material.emissive) mesh.material.emissive.set(0x444444);

  _showInfoPanel(mesh);
  _flashSvgElement(mesh.userData.svgEl);
  _needsRender = true;
};

const _showInfoPanel = (mesh) => {
  const panel = document.getElementById("inspector3dInfo");
  if (!panel) return;
  panel.style.display = "block"; // §2 hidden until something is picked

  const d  = mesh.userData;
  const el = d.svgEl;
  let content = "";

  if (el) {
    const pos = (typeof _getTranslate === "function") ? _getTranslate(el) : { x: 0, y: 0 };
    let bb = { width: 0, height: 0 };
    try { bb = el.getBBox(); } catch (_) {}

    content += `<div class="mb-2"><strong style="text-transform:capitalize;">${(d.elType || "unknown").replace("Box","")}</strong></div>`;
    content += `<div>Page: ${d.page}</div>`;
    content += `<div>X: ${pos.x.toFixed(1)} mm &nbsp; Y: ${pos.y.toFixed(1)} mm</div>`;
    content += `<div>W: ${bb.width.toFixed(1)} mm &nbsp; H: ${bb.height.toFixed(1)} mm</div>`;
    content += `<div>Depth: ${d.depth} &nbsp; Z-order: ${d.siblingIdx}</div>`;
    content += `<div>Locked: ${el.classList && el.classList.contains("locked") ? "Yes" : "No"}</div>`;

    if (d.elType === "textBox") {
      const textEl = el.querySelector ? el.querySelector("text") : null;
      if (textEl) {
        const preview = (textEl.dataset.rawText || textEl.textContent || "").slice(0, 80);
        content += `<div style="margin-top:6px;word-break:break-word;color:#8b949e;">"${preview}"</div>`;
      }
    }
  }

  const safeId = el && el.id ? el.id : "";
  // §3 Action buttons use the same circular overlay-button theme (undo-redo-btn)
  content += `
    <div style="margin-top:14px;display:flex;align-items:center;gap:8px;">
      <button class="undo-redo-btn" onclick="_flashSvgElement('${safeId}')" title="Locate on canvas"><i class="fa-solid fa-location-crosshairs"></i></button>
      <button class="undo-redo-btn" onclick="_inspector3dBringToFront()" title="Bring to front"><i class="fa-solid fa-angles-up"></i></button>
      <button class="undo-redo-btn" onclick="_inspector3dSendToBack()" title="Send to back"><i class="fa-solid fa-angles-down"></i></button>
    </div>
  `;
  panel.innerHTML = content;
};

const _flashSvgElement = (elOrId) => {
  const el = typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
  if (!el) return;
  el.style.outline = "3px solid #f00";
  el.style.filter  = "drop-shadow(0 0 4px #f00)";
  setTimeout(() => {
    el.style.outline = "";
    el.style.filter  = "";
  }, 800);
};

const _inspector3dBringToFront = () => {
  if (!_selectedMesh) return;
  const el = _selectedMesh.userData.svgEl;
  if (!el || !el.parentElement) return;
  if (typeof captureSnapshot === "function") captureSnapshot();
  el.parentElement.appendChild(el);
  if (window.THREE) _buildScene(window.THREE);
};

const _inspector3dSendToBack = () => {
  if (!_selectedMesh) return;
  const el = _selectedMesh.userData.svgEl;
  if (!el || !el.parentElement) return;
  if (typeof captureSnapshot === "function") captureSnapshot();
  el.parentElement.prepend(el);
  if (window.THREE) _buildScene(window.THREE);
};

/* ============================================================
   REALTIME SYNC (MutationObserver)
   ============================================================ */

const _startObserver = (THREE) => {
  const workspace = document.getElementById("workspace");
  if (!workspace) return;

  let debounceTimer = null;
  _observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (_overlayOpen) _buildScene(THREE);
    }, 150);
  });

  _observer.observe(workspace, {
    subtree:         true,
    childList:       true,
    attributeFilter: ["transform", "width", "height"],
  });
};

/* ============================================================
   KEYBOARD
   ============================================================ */

const _onInspectorKey = (e) => {
  if (!_overlayOpen) return;

  if (e.key === "Escape") { _closeInspector(); return; }
  if (e.key === "r" || e.key === "R") { _resetCamera(); return; }

  const pageNum = parseInt(e.key, 10);
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  if (pageNum >= 1 && pageNum <= Math.min(total, 9)) {
    _focusOnPage(pageNum);
  }
};

/* ============================================================
   CHROME TOGGLE
   ============================================================ */

const inspector3dToggleChrome = () => {
  _showChrome = !_showChrome;
  if (window.THREE && _overlayOpen) _buildScene(window.THREE);
};

/* ============================================================
   OVERLAY TOOLBAR ACTIONS — zoom (§4), page nav (§5), view mode (§2/§3)
   ============================================================ */

// §5 Zoom level readout. 100% = default radius (500); closer = higher %.
const _updateZoomLabel = () => {
  const lbl = document.getElementById("inspector3dZoomLabel");
  if (!lbl) return;
  const pct = Math.round((500 / _spherical.radius) * 100);
  lbl.innerHTML = `<i class="fa-solid fa-magnifying-glass me-1"></i>${pct}%`;
};

const inspector3dZoomIn  = () => {
  _spherical.radius = Math.max(50, _spherical.radius - 60);
  _needsRender = true;
  _updateZoomLabel();
};

const inspector3dZoomOut = () => {
  _spherical.radius = Math.min(3000, _spherical.radius + 60);
  _needsRender = true;
  _updateZoomLabel();
};

// §4 Background selection (white / whitish-grey / black)
const inspector3dSetBg = (name) => {
  if (!I3D_BACKGROUNDS[name]) return;
  _viewBg = name;
  if (typeof localStorage !== "undefined") localStorage.setItem("inspector3dBg", name);
  const container = document.getElementById("inspector3dContainer");
  const hex = "#" + I3D_BACKGROUNDS[name].toString(16).padStart(6, "0");
  if (container) container.style.background = hex;
  if (_renderer) _renderer.setClearColor(I3D_BACKGROUNDS[name], 1);
  document.querySelectorAll(".i3d-bg-swatch").forEach((b) =>
    b.classList.toggle("i3d-bg-active", b.dataset.bg === name));
  // §14 rebuild with the background-tuned palette + refresh legend colours
  if (window.THREE && _overlayOpen) _buildScene(window.THREE);
  _refreshLegend();
  _needsRender = true;
};

const _focusOnPage = (pageNum) => {
  const { width: pgW } = _pageDims();
  _focusPage = pageNum;
  _panOffset.x = (pageNum - 1) * (pgW + I3D_PAGE_GAP_MM);
  _panOffset.y = 0;
  _needsRender = true;
  const lbl = document.getElementById("inspector3dPageLabel");
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  if (lbl) lbl.textContent = `${pageNum}/${total}`;
};

const inspector3dPrevPage = () => {
  if (_focusPage > 1) _focusOnPage(_focusPage - 1);
};

const inspector3dNextPage = () => {
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  if (_focusPage < total) _focusOnPage(_focusPage + 1);
};

const _applyViewMode = () => {
  // Sync the overlay toggle button icon/title + the settings checkbox
  const btn = document.getElementById("inspector3dModeBtn");
  if (btn) {
    const icon = btn.querySelector("i");
    if (icon) icon.className = "fa-solid " + (_viewMode === "space" ? "fa-cube" : "fa-layer-group");
    btn.title = _viewMode === "space"
      ? "3D Space (axes) — switch to Layers"
      : "Layers — switch to 3D Space";
  }
  const chk = document.getElementById("inspector3dModeCheckbox");
  if (chk) chk.checked = _viewMode === "space";
  if (window.THREE && _overlayOpen) _buildScene(window.THREE);
};

const inspector3dToggleMode = () => {
  _viewMode = _viewMode === "space" ? "layers" : "space";
  if (typeof localStorage !== "undefined") localStorage.setItem("inspector3dMode", _viewMode);
  _applyViewMode();
};

// Settings switch entry point (mirrors the standard settings toggle pattern)
const toggleInspector3dMode = () => {
  inspector3dToggleMode();
  showToast(_viewMode === "space" ? "3D view: coordinate space (axes)" : "3D view: layers", "success");
};

/* ============================================================
   SETTINGS TOGGLE (§12 settings switch — optional gate)
   ============================================================ */

const toggle3dInspectorSetting = () => {
  const next = localStorage.getItem("inspector3d") !== "true";
  localStorage.setItem("inspector3d", next ? "true" : "false");
  showToast(next ? "3D layers enabled (use Show Layers)" : "3D layers disabled", "success");
};

document.addEventListener("DOMContentLoaded", () => {
  const chk = document.getElementById("inspector3dCheckbox");
  if (chk) chk.checked = localStorage.getItem("inspector3d") !== "false";
  const modeChk = document.getElementById("inspector3dModeCheckbox");
  if (modeChk) modeChk.checked = _viewMode === "space";
});

/* ============================================================
   WIRE UP showLayers (override the scripts.js placeholder)
   ============================================================ */
if (typeof window !== "undefined") {
  window.showLayers = toggle3dInspector;
}
