/**
 * barcodes.js — §4 Barcode / QR Elements
 *
 * Uses JsBarcode (CODE128/EAN) and qrcode.js.
 * Both render to a hidden canvas/svg, convert to PNG dataURL, then reuse
 * the existing addImageBox() — no new element type needed.
 *
 * CDN scripts are lazily loaded on first use via _injectScriptOnce().
 * Load order: after canvas-elements.js and merge.js.
 */

const JSBARCODE_CDN = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
// QR: davidshimjs "qrcodejs" (constructor API: new QRCode(el, opts)).
const QRCODE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
const QRCODE_CDN_INTEGRITY =
  "sha512-CNgIRecGo7nphbeZ04Sc13ka07paqdeTu0WR1IM4kNcpmBAUSHSQX0FslNhTDadL4O5SAGapGt4FodqL8My0mA==";

/* ============================================================
   LAZY SCRIPT LOADER
   ============================================================ */

const _scriptLoadPromises = {};
const _injectScriptOnce = (url, opts = {}) => {
  if (_scriptLoadPromises[url]) return _scriptLoadPromises[url];
  _scriptLoadPromises[url] = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = url;
    if (opts.integrity)      s.integrity      = opts.integrity;
    if (opts.crossOrigin)    s.crossOrigin    = opts.crossOrigin;
    if (opts.referrerPolicy) s.referrerPolicy = opts.referrerPolicy;
    s.onload = () => resolve();
    // Pass a REAL Error (not the raw event) so callers never surface "undefined".
    s.onerror = () => {
      delete _scriptLoadPromises[url];
      reject(new Error("Failed to load library: " + url));
    };
    document.head.appendChild(s);
  });
  return _scriptLoadPromises[url];
};

// Normalise any thrown value into a readable message (avoids "undefined").
const _errMsg = (err) => {
  if (!err) return "unknown error";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  try { return JSON.stringify(err); } catch (_) { return String(err); }
};

/* ============================================================
   DATA URL GENERATORS
   ============================================================ */

/**
 * _generateBarcodeDataUrl — renders a barcode to an off-screen canvas
 * and returns a PNG data URL.
 */
const _generateBarcodeDataUrl = async (text, format = "CODE128") => {
  await _injectScriptOnce(JSBARCODE_CDN);
  if (typeof JsBarcode === "undefined") {
    throw new Error("Barcode library unavailable");
  }
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    try {
      JsBarcode(canvas, text, {
        format,
        lineColor: "#000000",
        width: 2,
        height: 60,
        displayValue: true,
        margin: 5,
      });
      resolve(canvas.toDataURL("image/png"));
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * _generateQrDataUrl — renders a QR code to an off-screen canvas
 * and returns a PNG data URL.
 */
const _generateQrDataUrl = async (text) => {
  await _injectScriptOnce(QRCODE_CDN, {
    integrity: QRCODE_CDN_INTEGRITY,
    crossOrigin: "anonymous",
    referrerPolicy: "no-referrer",
  });
  // davidshimjs qrcodejs exposes a global constructor: new QRCode(el, opts).
  if (typeof QRCode === "undefined" || typeof QRCode !== "function") {
    throw new Error("QR library unavailable");
  }
  return new Promise((resolve, reject) => {
    try {
      // Render into a detached holder; the lib appends a <canvas> (+ <img> fallback).
      const holder = document.createElement("div");
      holder.style.cssText = "position:fixed;left:-99999px;top:0;";
      document.body.appendChild(holder);

      // eslint-disable-next-line no-new
      new QRCode(holder, {
        text,
        width: 256,
        height: 256,
        correctLevel: (QRCode.CorrectLevel ? QRCode.CorrectLevel.H : 2),
      });

      // The <img> fallback sets its src from canvas.toDataURL asynchronously,
      // so read on the next tick to be safe across both render paths.
      setTimeout(() => {
        try {
          const canvas = holder.querySelector("canvas");
          const img    = holder.querySelector("img");
          let dataUrl  = null;
          if (canvas) dataUrl = canvas.toDataURL("image/png");
          else if (img && img.src) dataUrl = img.src;
          holder.remove();
          if (!dataUrl) { reject(new Error("QR render produced no image")); return; }
          resolve(dataUrl);
        } catch (e) {
          holder.remove();
          reject(e instanceof Error ? e : new Error(_errMsg(e)));
        }
      }, 40);
    } catch (e) {
      reject(e instanceof Error ? e : new Error(_errMsg(e)));
    }
  });
};

/* ============================================================
   ADD BARCODE / QR MODALS
   ============================================================ */

const openBarcodeModal = () => {
  const modalEl = document.getElementById("barcodeModal");
  if (!modalEl) { showToast("barcodeModal not found", "danger"); return; }
  document.getElementById("barcodeContent").value = "";
  new bootstrap.Modal(modalEl).show();
};

const openQrModal = () => {
  const modalEl = document.getElementById("qrModal");
  if (!modalEl) { showToast("qrModal not found", "danger"); return; }
  document.getElementById("qrContent").value = "";
  new bootstrap.Modal(modalEl).show();
};

/**
 * addImageBox wrapper that returns the created group element.
 * The original addImageBox in canvas-elements.js doesn't return the group —
 * we re-select the last appended child as a best-effort approach.
 */
const _addImageBoxAndGetGroup = (dataUrl, wMm, hMm) => {
  if (typeof addImageBox !== "function") return null;
  // addImageBox(src, width, height, safeMarginMm=10) — do NOT pass extra args.
  addImageBox(dataUrl, wMm, hMm);
  const cl = (typeof getActiveContentLayer === "function") ? getActiveContentLayer() : null;
  return cl ? cl.lastElementChild : null;
};

const confirmAddBarcode = async () => {
  const content  = document.getElementById("barcodeContent")?.value.trim();
  const format   = document.getElementById("barcodeFormat")?.value  || "CODE128";
  const wMm      = parseFloat(document.getElementById("barcodeWidth")?.value  || "60");
  const hMm      = parseFloat(document.getElementById("barcodeHeight")?.value || "20");

  if (!content) { showToast("Barcode content required", "warning"); return; }

  try {
    showToast("Generating barcode…", "info");
    const dataUrl = await _generateBarcodeDataUrl(content, format);
    bootstrap.Modal.getInstance(document.getElementById("barcodeModal"))?.hide();

    const group = _addImageBoxAndGetGroup(dataUrl, wMm, hMm);
    // Store source for mail-merge regeneration (§4)
    if (group) {
      group.dataset.barcodeSrc  = content;
      group.dataset.barcodeType = format;
    }
    showToast("Barcode added!", "success");
  } catch (err) {
    console.error("Barcode error:", err);
    showToast("Barcode generation failed: " + _errMsg(err), "danger");
  }
};

const confirmAddQr = async () => {
  const content = document.getElementById("qrContent")?.value.trim();
  const sizeMm  = parseFloat(document.getElementById("qrSize")?.value || "30");

  if (!content) { showToast("QR content required", "warning"); return; }

  try {
    showToast("Generating QR code…", "info");
    const dataUrl = await _generateQrDataUrl(content);
    bootstrap.Modal.getInstance(document.getElementById("qrModal"))?.hide();

    const group = _addImageBoxAndGetGroup(dataUrl, sizeMm, sizeMm);
    if (group) group.dataset.qrSrc = content;

    showToast("QR code added!", "success");
  } catch (err) {
    console.error("QR error:", err);
    showToast("QR generation failed: " + _errMsg(err), "danger");
  }
};

// Convenience aliases (kept for any external callers)
const _barcodeAddImageBox = (dataUrl, wMm, hMm) => _addImageBoxAndGetGroup(dataUrl, wMm, hMm, 20, 20);
const _qrAddImageBox      = (dataUrl, sizeMm)   => _addImageBoxAndGetGroup(dataUrl, sizeMm, sizeMm, 20, 20);
