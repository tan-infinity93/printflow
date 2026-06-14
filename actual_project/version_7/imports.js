//
//

const jsonToDom = (json, parentNamespace = null) => {
  // 1️⃣ Handle text nodes (string values)
  if (typeof json === "string") {
    return document.createTextNode(json);
  }

  // 2️⃣ Validate object
  if (!json || !json.tagName) return null;

  // SVG_NS is defined globally in layout.js — no need to redeclare here

  // 3️⃣ Detect if SVG element
  const isSvgElement =
    parentNamespace === SVG_NS ||
    json.tagName === "svg" ||
    [
      "g",
      "text",
      "tspan",
      "rect",
      "circle",
      "path",
      "line",
      "polygon",
      "image",   // SVG <image> must be created in SVG namespace
      "use",
      "symbol",
      "defs",
      "clippath",
      "lineargradient",
      "radialgradient",
      "stop",
      "pattern",
      "mask",
      "filter",
      "foreignobject",
      "ellipse",
      "polyline",
    ].includes(json.tagName);

  const namespace = isSvgElement ? SVG_NS : null;

  const element = namespace
    ? document.createElementNS(namespace, json.tagName)
    : document.createElement(json.tagName);

  // 4️⃣ Restore attributes
  if (json.attributes) {
    for (const [key, value] of Object.entries(json.attributes)) {
      element.setAttribute(key, value);
    }
  }

  // 5️⃣ Restore children
  if (json.children && Array.isArray(json.children)) {
    for (const child of json.children) {
      const childNode = jsonToDom(child, namespace);
      if (childNode) element.appendChild(childNode);
    }
  }

  return element;
};

const confirmRawImportFile = () => {
  console.log("line 5...");
  const file = document.getElementById("rawImportFileName").files[0];
  if (!file) return;

  const fileName = file.name;
  const fileMode = fileName.split(".").pop().toLowerCase(); // file extension (last dot)

  const reader = new FileReader();

  reader.onload = async function (event) {
    try {
      const content  = event.target.result;

      if (fileMode === "json") {
        const parsed = JSON.parse(content);

        // Detect format: new multi-page { format, pages } vs old flat array
        let pages;
        if (parsed && parsed.format === "printflow" && Array.isArray(parsed.pages)) {
          // New unified multi-page format
          pages = parsed.pages;
          // Set page count from import
          const total = parsed.pageCount || pages.length;
          window.sessionStorage.setItem("totalPages", total);
          if (parsed.pageSize) {
            window.sessionStorage.setItem("pageSize", parsed.pageSize);
          }
        } else if (Array.isArray(parsed)) {
          // Legacy flat array (single page 1)
          pages = [{ pageNo: 1, elements: parsed }];
          window.sessionStorage.setItem("totalPages", 1);
        } else {
          showToast("Unrecognised JSON format", "danger");
          return;
        }

        // Rebuild canvas to match imported page count
        const pageSize = window.sessionStorage.getItem("pageSize") || "A4";
        layoutSvgCanvas(pageSize, true);
        const { width, height } = pageDimensions[pageSize];
        buildRulers(document.getElementById("workspace"), width, height);
        if (typeof _updatePageUI === "function") _updatePageUI();

        // Restore each page's elements
        pages.forEach(({ pageNo, elements }) => {
          const contentLayer = document.getElementById(`content-layer-${pageNo}`);
          if (!contentLayer) return;
          contentLayer.innerHTML = "";
          (elements || []).forEach((obj) => {
            const node = jsonToDom(obj);
            if (!node) return;
            contentLayer.appendChild(node);
            if (typeof reattachInteractions === "function") reattachInteractions(node);
          });
        });
      } else {
        // SVG import — the exported file is the FULL workspace SVG (rulers,
        // page rects, content layers). Injecting it wholesale into a content
        // layer would nest a second canvas with duplicate ids. Instead, parse
        // it and copy only the content-layer children for each page.
        const doc = new DOMParser().parseFromString(content, "image/svg+xml");
        if (doc.querySelector("parsererror")) {
          showToast("Could not parse SVG file", "danger");
          return;
        }

        const importedLayers = Array.from(
          doc.querySelectorAll('[id^="content-layer-"]'),
        );
        if (importedLayers.length === 0) {
          showToast("No PrintFlow content found in SVG file", "warning");
          return;
        }

        // Match page count to the imported document
        window.sessionStorage.setItem("totalPages", importedLayers.length);
        const pageSize = window.sessionStorage.getItem("pageSize") || "A4";
        layoutSvgCanvas(pageSize, true);
        const { width, height } = pageDimensions[pageSize];
        buildRulers(document.getElementById("workspace"), width, height);
        if (typeof _updatePageUI === "function") _updatePageUI();

        importedLayers.forEach((srcLayer, idx) => {
          const destLayer = document.getElementById(`content-layer-${idx + 1}`);
          if (!destLayer) return;
          destLayer.innerHTML = "";
          Array.from(srcLayer.children).forEach((child) => {
            const node = document.importNode(child, true);
            destLayer.appendChild(node);
            if (typeof reattachInteractions === "function") reattachInteractions(node);
          });
        });
        if (typeof updateElementCounters === "function") updateElementCounters();
      }

      // Store Audit Log:

      const logRecord = {
        id: crypto.randomUUID(),
        entry: "New File Imported",
        timeStamp: `${new Date().toISOString()}`,
        fileName: fileName,
      };
      const storeName = "printingAuditLogs";
      await saveRecordToDB(logRecord, storeName);

      showToast("File Backup Import is successful...!!!");

      // Update Stats:

      let stats = window.sessionStorage.getItem("stats");
      stats = JSON.parse(stats) || { fileExports: {}, fileImports: {} };

      if (stats.fileImports[fileMode] === undefined) stats.fileImports[fileMode] = 0;
      stats.fileImports[fileMode] += 1;

      stats = JSON.stringify(stats);
      window.sessionStorage.setItem("stats", stats);
    } catch (error) {
      showToast("File Backup Import is failed...!!!", "danger");
    }
  };
  reader.readAsText(file);
};

//

document.addEventListener("hidden.bs.modal", function () {
  // If there's still an open modal, keep the scrollbar active
  if (document.querySelectorAll(".modal.show").length > 0) {
    document.body.classList.add("modal-open");
  }
});

const importTemplateFile = () => {
  // 1. Remove focus from the button immediately
  if (document.activeElement) {
    document.activeElement.blur();
  }

  // Hide Template Gallery Modal
  bootstrap.Modal.getInstance(
    document.getElementById("templateGalleryModal"),
  ).hide();

  // Show Import Template File Modal
  const modal = new bootstrap.Modal(
    document.getElementById("rawImportTemplateFileModal"),
  );
  modal.show();

  // Show render from Object Store:
};

const closeImportTemplateFileName = () => {
  // 1. Remove focus from the button immediately
  if (document.activeElement) {
    document.activeElement.blur();
  }

  // Hide Import Template File Modal
  bootstrap.Modal.getInstance(
    document.getElementById("rawImportTemplateFileModal"),
  ).hide();

  // Show Template Gallery Modal
  const modal = new bootstrap.Modal(
    document.getElementById("templateGalleryModal"),
  );
  modal.show();

  // Process Uploaded Template File and Add into Object Store:

  const file = document.getElementById("importTemplateFileName").files[0];
  if (!file) return;

  const fileName = file.name;
  const fileMode = fileName.split(".").pop().toLowerCase(); // file extension (last dot)

  const reader = new FileReader();

  reader.onload = async function (event) {
    try {
      const content = JSON.parse(event.target.result);
      console.log("File content:", content);

      // Save imported template JSON directly to the templates store
      await saveRecordToDB(content, "printingTemplates");

      showToast("Template File Import is successful...!!!");
    } catch (error) {
      console.log(error);
      showToast("Template File Import is failed...!!!", "danger");
    }
  };

  reader.onerror = (error) => {
    console.error("FileReader Error:", error);
    showToast("Could not read the file", "danger");
  };

  reader.readAsText(file);
};

const loadSelectedTemplateFile = async (templateId) => {
  if (document.activeElement) document.activeElement.blur();

  try {
    const templateData = await getSingleRecordFromDB(templateId);

    // --- Unified DOM JSON format ---
    // Template record has { elements: [...domToJson results] }
    // Legacy records have { [pageType]: [...semantic elements] }
    const elements = templateData.elements;

    if (!Array.isArray(elements) || elements.length === 0) {
      showToast("Template is empty or in an old format", "warning");
      bootstrap.Modal.getInstance(document.getElementById("templateGalleryModal")).hide();
      return;
    }

    // Load into active page's content layer
    const contentLayer = (typeof getActiveContentLayer === "function")
      ? getActiveContentLayer()
      : document.getElementById("content-layer-1");

    if (!contentLayer) {
      showToast("No active page found", "danger");
      return;
    }

    elements.forEach((obj) => {
      if (!obj) return;
      const node = jsonToDom(obj);
      if (!node) return;
      contentLayer.appendChild(node);
      if (typeof reattachInteractions === "function") reattachInteractions(node);
    });

    bootstrap.Modal.getInstance(
      document.getElementById("templateGalleryModal"),
    ).hide();

    const logRecord = {
      id: crypto.randomUUID(),
      entry: `New Template Loaded with Id: ${templateId.slice(0, 8)}`,
      timeStamp: `${new Date().toISOString()}`,
    };
    const storeName = "printingAuditLogs";
    await saveRecordToDB(logRecord, storeName);

    showToast("Template Loaded successfully!", "success");
  } catch (error) {
    console.warn(error);
    showToast("Template Loading Error!", "danger");
  }
};

/* ============================================================
   §9 WORKSPACE RESTORE
   ============================================================ */

/**
 * importWorkspaceBackup — validates a printflow-backup JSON file, confirms
 * with the user, clears all stores, re-inserts records, then redirects to
 * login (users must re-authenticate after restore).
 */
const importWorkspaceBackup = async (file) => {
  if (!file) return;
  let backup;
  try {
    backup = JSON.parse(await file.text());
  } catch (_) {
    showToast("Cannot parse backup file", "danger");
    return;
  }

  if (backup.format !== "printflow-backup") {
    showToast("Not a valid PrintFlow backup file", "danger");
    return;
  }

  showConfirmModal(
    "Restore Workspace",
    "This will OVERWRITE all current data with the backup contents. Users will need to log in again. Continue?",
    async () => {
      showToast("Restoring backup…", "info");
      try {
        const stores = backup.stores || {};
        for (const storeName of Object.keys(stores)) {
          // Skip user passwords — restore users but require re-login
          await clearStore(storeName).catch(() => {});
          for (const record of (stores[storeName] || [])) {
            await saveRecordToDB(record, storeName).catch(() => {});
          }
        }

        // Restore draft if present
        if (backup.appSettings && backup.appSettings.draft) {
          localStorage.setItem("printflow_draft", backup.appSettings.draft);
        }

        const logRecord = {
          id:        crypto.randomUUID(),
          entry:     `Workspace restored from backup (exported ${backup.exportedAt || "unknown"})`,
          timeStamp: new Date().toISOString(),
        };
        await saveRecordToDB(logRecord, "printingAuditLogs").catch(() => {});

        showToast("Backup restored! Redirecting to login…", "success");
        // Users must re-login — passwords were restored but session is invalid
        window.sessionStorage.clear();
        localStorage.removeItem("loggedInUser");
        setTimeout(() => { window.location.href = "index.html"; }, 2500);
      } catch (err) {
        console.error("Backup restore error:", err);
        showToast("Restore failed: " + err.message, "danger");
      }
    },
  );
};

const onBackupFileChange = (e) => {
  const file = e.target.files[0];
  if (file) importWorkspaceBackup(file);
};

const deleteSelectedTemplateFile = async (templateId) => {
  try {
    let templateData = await deleteSingleRecordFromDB(templateId);
    showToast("Template Deleted successfully!", "success");

    const modal = new bootstrap.Modal(
      document.getElementById("templateGalleryModal"),
    );
    modal.hide();

    document.getElementById("templateGalleryModal").addEventListener(
      "hidden.bs.modal",
      () => {
        const backdrop = document.querySelector(".modal-backdrop");
        if (backdrop) backdrop.remove();
        document.body.style.overflow = "auto"; // Re-enable scrolling
        document.body.classList.remove("modal-open");
      },
      { once: true },
    );

    openTemplateGalleryModal();
  } catch (error) {
    console.warn(error);
    showToast("Template Deleting Error!", "danger");
  }
};
