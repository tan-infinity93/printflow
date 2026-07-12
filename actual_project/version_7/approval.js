/**
 * approval.js — §7 Approval Workflow (draft → approved → locked)
 *
 * docStatus: "draft" | "approved" — stored in sessionStorage "docStatus"
 * and stamped into printingVersionLogs records on save.
 *
 * Navbar status chip shows current state. Admin-only approve/unapprove.
 * While Draft, a faint diagonal "DRAFT" watermark is stamped on each PDF
 * page at export time (both raster and vector pipelines).
 *
 * Load order: after scripts.js (uses captureSnapshot, showToast, etc.)
 */

/* ============================================================
   STATUS MANAGEMENT
   ============================================================ */

const getDocStatus = () => window.sessionStorage.getItem("docStatus") || "draft";

const _setDocStatus = (status) => {
  window.sessionStorage.setItem("docStatus", status);
  _updateStatusChip();
};

const _updateStatusChip = () => {
  const chip = document.getElementById("docStatusChip");
  if (chip) {
    const status = getDocStatus();
    chip.textContent = status === "approved" ? "Approved" : "Draft";
    chip.className = "badge rounded-pill ms-2 " + (status === "approved" ? "bg-success" : "bg-secondary");
  }
  // Toggle per-page DRAFT badges
  const isDraft = getDocStatus() !== "approved";
  document.querySelectorAll(".page-draft-badge").forEach((el) => {
    el.style.display = isDraft ? "" : "none";
  });
};

// Show approve/revoke rows ONLY for admin users (one below the other).
const _refreshApprovalRows = () => {
  _updateStatusChip();
  const isAdmin = _isAdmin();
  const approveRow   = document.getElementById("approveDocRow");
  const unapproveRow = document.getElementById("unapproveDocRow");
  if (approveRow)   approveRow.style.display   = isAdmin ? "" : "none";
  if (unapproveRow) unapproveRow.style.display = isAdmin ? "" : "none";
};

// Run on load. We re-run on window "load" too: scripts.js setDefaults seeds
// sessionStorage.loggedInUser from the localStorage copy during window load,
// so a DOMContentLoaded-only check can run before the admin user is known.
document.addEventListener("DOMContentLoaded", _refreshApprovalRows);
window.addEventListener("load", _refreshApprovalRows);

/* ============================================================
   APPROVE / UN-APPROVE
   ============================================================ */

const _getLoggedInUser = () => {
  // sessionStorage is the live per-tab copy, but a fresh tab/reload may only
  // have the persistent localStorage copy until setDefaults re-seeds it.
  try {
    return JSON.parse(
      window.sessionStorage.getItem("loggedInUser") ||
      window.localStorage.getItem("loggedInUser") ||
      "null",
    );
  } catch (_) { return null; }
};

const _isAdmin = () => {
  const user = _getLoggedInUser();
  return !!(user && user.userType === "appAdmin");
};

const approveDocument = async () => {
  if (!_isAdmin()) { showToast("Only an admin can approve documents", "warning"); return; }
  if (getDocStatus() === "approved") { showToast("Document is already approved", "info"); return; }

  // Lock all elements
  if (typeof toggleLockAllElements === "function") {
    const locked = document.querySelectorAll(".design-object.locked").length;
    const total  = document.querySelectorAll(".design-object").length;
    if (locked < total) toggleLockAllElements();
  }

  _setDocStatus("approved");

  const user = _getLoggedInUser();
  const userName = user ? user.userName : "unknown";

  const logRecord = {
    id: crypto.randomUUID(),
    entry: `Approved by ${userName}`,
    timeStamp: new Date().toISOString(),
  };
  await saveRecordToDB(logRecord, "printingAuditLogs").catch(() => {});

  showToast("Document approved and locked", "success");
};

const unapproveDocument = async () => {
  if (!_isAdmin()) { showToast("Only an admin can unapprove documents", "warning"); return; }
  if (getDocStatus() !== "approved") { showToast("Document is not approved", "info"); return; }

  // Unlock all elements
  if (typeof toggleLockAllElements === "function") {
    const locked = document.querySelectorAll(".design-object.locked").length;
    if (locked > 0) toggleLockAllElements();
  }

  _setDocStatus("draft");

  const user = _getLoggedInUser();
  const userName = user ? user.userName : "unknown";

  const logRecord = {
    id: crypto.randomUUID(),
    entry: `Un-approved by ${userName}`,
    timeStamp: new Date().toISOString(),
  };
  await saveRecordToDB(logRecord, "printingAuditLogs").catch(() => {});

  showToast("Document un-approved", "success");
};

/* ============================================================
   DRAFT / TRIAL WATERMARK STAMPING
   Used by both raster and vector PDF pipelines.
   Called from scripts.js exportAsPDF.
   ============================================================ */

/**
 * _stampWatermarkOnCanvas — draws a faint diagonal "DRAFT" (or custom text)
 * across an html2canvas capture slice canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx   — the slice canvas context
 * @param {number}  w    — canvas width in px
 * @param {number}  h    — canvas height in px
 * @param {string}  text — watermark text (default "DRAFT")
 */
const _stampWatermarkOnCanvas = (ctx, w, h, text = "DRAFT") => {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.font = `bold ${Math.min(w, h) * 0.15}px Arial`;
  ctx.fillStyle = "rgba(180, 0, 0, 0.10)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
};

/**
 * _stampWatermarkOnPdf — adds a faint diagonal text to the current jsPDF page
 * using the pdf.text() angle option (vector pipeline).
 *
 * @param {jsPDF}  pdf    — active jsPDF instance
 * @param {number} pdfW   — page width in mm
 * @param {number} pdfH   — page height in mm
 * @param {string} text   — watermark text
 */
const _stampWatermarkOnPdf = (pdf, pdfW, pdfH, text = "DRAFT") => {
  pdf.saveGraphicsState();
  pdf.setTextColor(220, 0, 0);
  pdf.setGState(new pdf.GState({ opacity: 0.10 }));
  pdf.setFontSize(Math.min(pdfW, pdfH) * 0.5);
  pdf.text(text, pdfW / 2, pdfH / 2, { align: "center", angle: 45 });
  pdf.restoreGraphicsState();
};

/**
 * shouldStampWatermark — returns the watermark text if the current export
 * should show one, or null if not.
 * - "DRAFT" if doc status is draft
 * - "TRIAL" if license tier is trial (§8)
 */
const shouldStampWatermark = () => {
  // License trial watermark (§8)
  if (typeof License !== "undefined" && License.current().tier === "trial") return "TRIAL";
  // Draft watermark
  if (getDocStatus() === "draft") return "DRAFT";
  return null;
};
