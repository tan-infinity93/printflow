/**
 * brandkit.js — §2 Brand Kit + per-element locking.
 *
 * Brand kit record in IndexedDB "printingBrandKit" store (v2):
 *   { id: "default", companyName, addressBlock, email, phone,
 *     logoDataUrl (base64), primaryColor, fontFamily }
 *
 * Auto-variables resolved by merge.js applyVariables():
 *   {{brand_company}}, {{brand_address}}, {{brand_email}}, {{brand_phone}}
 *
 * Load order: after merge.js.
 */

/* ============================================================
   BRAND KIT CRUD
   ============================================================ */

const DEFAULT_KIT_ID = "default";

const loadBrandKit = async () => {
  return await getSingleRecordFromDB(DEFAULT_KIT_ID, "printingBrandKit").catch(() => null);
};

const saveBrandKit = async () => {
  const kit = {
    id: DEFAULT_KIT_ID,
    companyName: document.getElementById("bkCompanyName")?.value.trim() || "",
    addressBlock: document.getElementById("bkAddressBlock")?.value.trim() || "",
    email:        document.getElementById("bkEmail")?.value.trim() || "",
    phone:        document.getElementById("bkPhone")?.value.trim() || "",
    primaryColor: document.getElementById("bkPrimaryColor")?.value || "#0d6efd",
    fontFamily:   document.getElementById("bkFontFamily")?.value || "Inter",
    logoDataUrl:  window._bkLogoDataUrl || null,
  };
  await saveRecordToDB(kit, "printingBrandKit");
  showToast("Brand kit saved!", "success");

  // register auto-variables so future merges pick them up
  _registerBrandKitVars(kit);

  const logRecord = {
    id: crypto.randomUUID(),
    entry: "Brand kit updated",
    timeStamp: new Date().toISOString(),
  };
  await saveRecordToDB(logRecord, "printingAuditLogs").catch(() => {});
};

// Populated on brand kit load; consumed by merge.js via getBrandKitVars()
let _brandKitVarCache = {};

const _registerBrandKitVars = (kit) => {
  if (!kit) return;
  _brandKitVarCache = {
    brand_company: kit.companyName || "",
    brand_address: kit.addressBlock || "",
    brand_email:   kit.email || "",
    brand_phone:   kit.phone || "",
  };
};

/**
 * getBrandKitVars — called by applyVariables (merge.js) to inject brand auto-vars.
 * Exported to global scope.
 */
const getBrandKitVars = () => ({ ..._brandKitVarCache });

/* ============================================================
   BRAND KIT MODAL
   ============================================================ */

const openBrandKitModal = async () => {
  const kit = await loadBrandKit();
  if (kit) {
    _fillBrandKitForm(kit);
    _registerBrandKitVars(kit);
  }

  // Populate sequence manager
  await openSequenceManager();

  const modal = new bootstrap.Modal(document.getElementById("brandKitModal"));
  modal.show();
};

const _fillBrandKitForm = (kit) => {
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
  setVal("bkCompanyName", kit.companyName);
  setVal("bkAddressBlock", kit.addressBlock);
  setVal("bkEmail", kit.email);
  setVal("bkPhone", kit.phone);
  setVal("bkPrimaryColor", kit.primaryColor || "#0d6efd");
  setVal("bkFontFamily", kit.fontFamily || "Inter");

  window._bkLogoDataUrl = kit.logoDataUrl || null;
  const preview = document.getElementById("bkLogoPreview");
  if (preview) {
    preview.src = kit.logoDataUrl || "";
    preview.style.display = kit.logoDataUrl ? "block" : "none";
  }
};

const onBkLogoChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  // Reuse existing getImageUrl (canvas-elements.js) if available
  if (typeof getImageUrl === "function") {
    getImageUrl(file).then((url) => {
      window._bkLogoDataUrl = url;
      const preview = document.getElementById("bkLogoPreview");
      if (preview) { preview.src = url; preview.style.display = "block"; }
    });
  } else {
    const reader = new FileReader();
    reader.onload = (ev) => {
      window._bkLogoDataUrl = ev.target.result;
      const preview = document.getElementById("bkLogoPreview");
      if (preview) { preview.src = ev.target.result; preview.style.display = "block"; }
    };
    reader.readAsDataURL(file);
  }
};

/* ============================================================
   INSERT LETTERHEAD
   ============================================================ */

const insertLetterhead = async () => {
  const kit = await loadBrandKit();
  if (!kit) { showToast("No brand kit saved. Fill in brand kit first.", "warning"); return; }

  captureSnapshot(); // BEFORE mutation

  const pageSize = window.sessionStorage.getItem("pageSize") || "A4";
  const { width: pgW } = pageDimensions[pageSize];

  // Insert logo image box if logo exists
  if (kit.logoDataUrl && typeof addImageBox === "function") {
    addImageBox(kit.logoDataUrl, 40, 20, 15, 10);
  }

  // Insert address text box
  if (typeof addTextBox === "function") {
    const addressText = `${kit.companyName || ""}
${kit.addressBlock || ""}
${kit.email || ""} | ${kit.phone || ""}`;
    addTextBox("letterhead-address", pgW * 0.4, 15, pgW * 0.55, addressText, 3.5);
  }

  // Lock all newly inserted letterhead elements
  setTimeout(() => {
    document.querySelectorAll(".design-object:not(.locked)").forEach((el) => {
      if (el.dataset && el.dataset.role === "letterhead-address") {
        toggleElementLock(el);
      }
    });
  }, 100);

  showToast("Letterhead inserted!", "success");
  bootstrap.Modal.getInstance(document.getElementById("brandKitModal"))?.hide();
};

/* ============================================================
   PER-ELEMENT LOCKING
   ============================================================ */

/**
 * toggleElementLock — toggles the "locked" class on an element and
 * adds/removes a lock-indicator chrome glyph.
 * Respects admin-only unlock rule from §2.1.
 */
const toggleElementLock = (el) => {
  if (!el) el = document.getElementById(window.sessionStorage.getItem("divToBeClosed"));
  if (!el) return;

  const isLocked = el.classList.contains("locked");

  if (isLocked) {
    // Unlock: admin-only check
    let user = null;
    try { user = JSON.parse(window.sessionStorage.getItem("loggedInUser") || "null"); } catch (_) {}
    if (!user || user.userType !== "appAdmin") {
      showToast("Only an admin can unlock elements", "warning");
      return;
    }
    el.classList.remove("locked");
    // Remove lock indicator
    el.querySelector(".lock-indicator")?.remove();
    showToast("Element unlocked", "success");
  } else {
    el.classList.add("locked");
    // Add lock glyph (excluded from export via page-watermark class)
    const existing = el.querySelector(".lock-indicator");
    if (!existing) {
      const lockEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      lockEl.classList.add("page-watermark", "lock-indicator");
      lockEl.setAttribute("font-size", "4");
      lockEl.setAttribute("x", "1");
      lockEl.setAttribute("y", "5");
      lockEl.setAttribute("fill", "#dc3545");
      lockEl.textContent = "🔒";
      lockEl.style.display = "block"; // toggle display, not visibility
      el.appendChild(lockEl);
    }
    showToast("Element locked", "success");
  }
};

/**
 * Patch the sharedToolsHTML in canvas-interactions.js context menu to include
 * the Lock toggle. We do this by patching showContextMenu's output post-render.
 * This function is called from scripts after context menu is shown.
 */
const injectLockButton = (targetId) => {
  const contextOptionsDiv = document.getElementById("contextOptions");
  if (!contextOptionsDiv) return;

  const target = document.getElementById(targetId);
  const isLocked = target && target.classList.contains("locked");

  // Don't duplicate
  if (contextOptionsDiv.querySelector(".lock-element-btn")) return;

  const lockDiv = document.createElement("div");
  lockDiv.className = "context-menu-section px-3 py-2";
  lockDiv.innerHTML = `
    <label class="context-menu-label"><i class="fa-solid fa-lock me-1"></i>Element Lock</label>
    <div class="d-flex gap-2 align-items-center">
      <button class="btn btn-sm context-tool-btn lock-element-btn ${isLocked ? "btn-danger" : "btn-outline-secondary"}"
              onclick="toggleElementLock()" title="${isLocked ? "Unlock (admin only)" : "Lock element"}">
        <i class="fa-solid ${isLocked ? "fa-lock-open" : "fa-lock"}"></i>
        <span class="ms-1 small">${isLocked ? "Unlock" : "Lock"}</span>
      </button>
      ${isLocked ? '<span class="small text-danger"><i class="fa-solid fa-circle-exclamation me-1"></i>Locked</span>' : ""}
    </div>
  `;
  contextOptionsDiv.appendChild(lockDiv);
};

// Initialise brand kit vars on page load so auto-vars are available immediately
(async () => {
  const kit = await loadBrandKit().catch(() => null);
  if (kit) _registerBrandKitVars(kit);
})();
