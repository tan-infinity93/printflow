/* */

// Default export format is JSON; the settings switch toggles to SVG
// (internally stored as "html" for legacy reasons).
const saveExportMode = () => {
  let fileMode = window.sessionStorage.getItem("fileMode") || "json";
  fileMode = fileMode === "json" ? "html" : "json";
  window.sessionStorage.setItem("fileMode", fileMode);
};

/**
 * toggleSplashScreen — persists the "Show Splash Screen" app setting.
 * Read by index.html on load: when "false", the splash reveal animation
 * is skipped. Stored in localStorage so it survives logout/session clear.
 */
const toggleSplashScreen = () => {
  const current = localStorage.getItem("showSplashScreen") !== "false";
  const next = !current;
  localStorage.setItem("showSplashScreen", next ? "true" : "false");
  if (typeof showToast === "function") {
    showToast(next ? "Splash screen enabled" : "Splash screen disabled", "success");
  }
};

const domToJson = (node) => {
  // Handle text nodes: return string content if it's not just whitespace
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue.trim() ? node.nodeValue : null;
  }

  // Handle non-element nodes (comments, etc.)
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  // Skip runtime UI overlays — resize handles are rebuilt on load, and an
  // open inline cell editor (foreignObject) must never end up in a snapshot.
  if (
    node.classList &&
    (node.classList.contains("img-resize-handle") ||
      node.classList.contains("cell-edit-fo"))
  ) {
    return null;
  }

  const obj = {
    tagName: node.tagName.toLowerCase(),
    attributes: {},
    children: [],
  };

  // 1. Capture all attributes safely
  if (node.attributes) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      obj.attributes[attr.name] = attr.value;
    }
  }

  // 2. Fix: Use Array.from to ensure childNodes is iterable
  const children = Array.from(node.childNodes);
  for (const child of children) {
    const childJson = domToJson(child);
    if (childJson !== null) {
      obj.children.push(childJson);
    }
  }

  return obj;
};

const confirmRawExportFile = async () => {
  let fileName = document.getElementById("rawExportFileName").value.trim();
  // Default to JSON when the user never touched the export-format switch —
  // previously a null fileMode produced JSON content with a .svg extension.
  const fileMode = window.sessionStorage.getItem("fileMode") || "json";
  let blob;

  if (fileName === "") {
    showToast("File Name cannot be empty", "warning");
    return;
  }

  const expectedExt = fileMode === "json" ? ".json" : ".svg";
  if (!fileName.endsWith(expectedExt)) {
    fileName = fileName.replace(/\.(json|svg|html)$/, "") + expectedExt;
  }

  // Collect all pages
  const total    = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  const pageSize = window.sessionStorage.getItem("pageSize") || "A4";

  if (fileMode === "html") {
    // SVG export: first page content only (SVG canvas is multi-page)
    const svg = document.getElementById("workspace");
    // Hide runtime-only UI elements before capture
    const uiEls = svg.querySelectorAll(".img-resize-handle, .page-watermark");
    uiEls.forEach((h) => h.setAttribute("visibility", "hidden"));
    const svgContent = svg.outerHTML;
    uiEls.forEach((h) => h.setAttribute("visibility", "visible"));
    blob = new Blob([svgContent], { type: "image/svg+xml" });
  } else {
    // JSON export — unified multi-page DOM JSON format
    const pages = [];
    for (let p = 1; p <= total; p++) {
      const cl = document.getElementById(`content-layer-${p}`);
      pages.push({
        pageNo: p,
        elements: cl ? Array.from(cl.children).map((c) => domToJson(c)) : [],
      });
    }
    const exportPayload = {
      format:    "printflow",
      version:   "2.0",
      pageSize,
      pageCount: total,
      pages,
    };
    blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
  }

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Update Stats:

  let stats = window.sessionStorage.getItem("stats");
  stats = JSON.parse(stats) || { fileExports: {}, fileImports: {} };

  if (stats.fileExports[fileMode] === undefined) stats.fileExports[fileMode] = 0;
  stats.fileExports[fileMode] += 1;

  stats = JSON.stringify(stats);
  window.sessionStorage.setItem("stats", stats);

  // Save Version Info:

  // const currentTimestamp = new Date().toISOString();
  // let versionHistory = window.sessionStorage.getItem("versionHistory");
  // versionHistory = JSON.parse(versionHistory);

  // let version = {
  //   fileName: currentTimestamp,
  // };

  // versionHistory.push(version);
  // versionHistory = JSON.stringify(versionHistory);
  // window.sessionStorage.setItem("versionHistory", versionHistory);
  // showVersionHistory();

  const logRecord = {
    id: crypto.randomUUID(),
    entry: "New Export created",
    timeStamp: `${new Date().toISOString()}`,
    fileName: fileName,
  };
  const storeName = "printingAuditLogs";
  await saveRecordToDB(logRecord, storeName);
};

// exportCurrentWorkSpace();

/**
 * saveAppSettings — reads current panel visibility state (does NOT toggle anything)
 * and persists it to sessionStorage so loadAppSettings can restore it on reload.
 */
const saveAppSettings = () => {
  const menuNames = [
    // Left panel
    "page-setup-and-coordinates",
    "pointer-coordinates",
    "document-preset",
    "document-elements",
    "zoom-controls",
    "grid-controls",
    "safe-zone-controls",
    "print-controls",
    // Right panel — previously toggleable but never persisted
    "app-storage-usage",
    "app-downloads",
    "document-version-history",
    "document-audit-history",
  ];

  const appSettings = { leftHandMenu: {} };

  menuNames.forEach((menuName) => {
    const menuDiv = document.getElementById(menuName);
    if (!menuDiv) return;
    // Read current visibility — 0 = hidden, 1 = visible
    appSettings.leftHandMenu[menuName] = menuDiv.classList.contains("hidden") ? "0" : "1";
  });

  window.sessionStorage.setItem("appSettings", JSON.stringify(appSettings));
  showToast("App settings saved!", "success");
};

/**
 * loadAppSettings — restores panel visibility from sessionStorage.
 * Called from onloadInit so panels stay in user-preferred state across reloads.
 */
const loadAppSettings = () => {
  const raw = window.sessionStorage.getItem("appSettings");
  if (!raw) return;

  try {
    const appSettings = JSON.parse(raw);
    const panels = appSettings.leftHandMenu || {};

    Object.entries(panels).forEach(([menuName, visible]) => {
      const menuDiv = document.getElementById(menuName);
      if (!menuDiv) return;
      if (visible === "0") {
        menuDiv.classList.add("hidden");
      } else {
        menuDiv.classList.remove("hidden");
      }
    });
  } catch (e) {
    console.warn("loadAppSettings: could not parse saved settings", e);
  }
};

/**
 * toggleInlineCellEdit — switches between the two table-cell editing UX
 * options: inline foreignObject input on double-click (on) vs context-menu
 * input only (off, default). Persisted in localStorage for A/B testing both.
 */
const toggleInlineCellEdit = () => {
  const next = localStorage.getItem("inlineCellEdit") !== "true";
  localStorage.setItem("inlineCellEdit", next ? "true" : "false");
  showToast(
    next
      ? "Inline cell editing ON — double-click a table cell"
      : "Inline cell editing OFF — edit cells via right-click menu",
    "success",
  );
};

/**
 * toggleVectorPdf — switches the PDF export pipeline between raster
 * (html2canvas, default) and vector (svg2pdf.js, sharp text).
 */
const toggleVectorPdf = () => {
  const next = localStorage.getItem("vectorPdfExport") !== "true";
  localStorage.setItem("vectorPdfExport", next ? "true" : "false");
  showToast(
    next ? "PDF export: vector (sharp text)" : "PDF export: raster",
    "success",
  );
};

/**
 * restoreAppSettings — re-applies the last saved panel visibility state.
 * Called from the "Restore App Settings" switch in the Settings modal
 * (was previously referenced but never defined → ReferenceError on click).
 */
const restoreAppSettings = () => {
  if (!window.sessionStorage.getItem("appSettings")) {
    showToast("No saved app settings found", "warning");
    return;
  }
  loadAppSettings();
  showToast("App settings restored!", "success");
};

const resetAppSettings = async () => {
  window.sessionStorage.clear();

  const logRecord = {
    id: crypto.randomUUID(),
    entry: "App Storage Cleared",
    timeStamp: `${new Date().toISOString()}`,
  };
  const storeName = "printingAuditLogs";
  await saveRecordToDB(logRecord, storeName);

  showToast("App Settings cleared successfully, will reload page", "success");

  // check logic below:
  // let checkbox = document.getElementById("resetAppSettingsCheckbox");
  // checkbox.checked = false;

  // if (checkbox.checked == true) {
  //   checkbox.checked = false;
  // }
  // document.getElementById("resetAppSettingsCheckbox").checked = false;

  // Reload App to set initial variables in sessionStorage for now:
  setTimeout(() => {
    window.location.reload();
  }, 3000);
};

// showVersionHistory() was removed — version history is now managed in stats.js
// via loadVersionHistory() with real IndexedDB-backed restore via restoreVersion().

/* ============================================================
   §9 WORKSPACE BACKUP
   ============================================================ */

/**
 * exportWorkspaceBackup — reads ALL IndexedDB stores and current settings into
 * a single JSON file: printflow-backup-YYYYMMDD.json
 * Stable versioned format intended as the future backend sync format.
 */
const exportWorkspaceBackup = async () => {
  showToast("Preparing workspace backup…", "info");

  const storeData = {};
  for (const storeName of STORE_NAMES) {
    try {
      storeData[storeName] = await getAllRecordsFromDB(storeName);
    } catch (_) {
      storeData[storeName] = [];
    }
  }

  const backup = {
    format:     "printflow-backup",
    version:    1,
    exportedAt: new Date().toISOString(),
    appVersion: "7",
    stores:     storeData,
    appSettings: {
      pageSize:     window.sessionStorage.getItem("pageSize"),
      totalPages:   window.sessionStorage.getItem("totalPages"),
      displayMode:  window.sessionStorage.getItem("displayMode"),
      draft:        localStorage.getItem("printflow_draft"),
      loggedInUser: localStorage.getItem("loggedInUser"),
    },
  };

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const fileName = `printflow-backup-${dateStr}.json`;
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  const logRecord = {
    id:        crypto.randomUUID(),
    entry:     `Workspace backup exported: ${fileName}`,
    timeStamp: new Date().toISOString(),
  };
  await saveRecordToDB(logRecord, "printingAuditLogs").catch(() => {});

  showToast("Workspace backup downloaded!", "success");
};
