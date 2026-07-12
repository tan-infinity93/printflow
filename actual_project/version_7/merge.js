/**
 * merge.js — Template variable extraction, substitution, mail merge, and sequences.
 * §1 Template Variables + Mail Merge | §3 Auto-numbering Sequences
 *
 * Load order: after letters.js (which it optionally calls back into).
 * Depends on: shared-db.js, scripts.js (captureSnapshot, showToast, domToJson,
 *   _currentAllPagesSnapshot, _applySnapshot, exportAsPDF / _exportRasterPDF / _exportVectorPDF),
 *   canvas-elements.js (wrapSvgText)
 */

/* ============================================================
   1. VARIABLE EXTRACTION
   ============================================================ */

/**
 * extractVariables — scans every content-layer's text nodes and tspan elements
 * for {{variable_name}} patterns and returns a sorted array of unique names.
 * Reserved auto-variables (date, page, seq:*) are included if found in text.
 */
const extractVariables = () => {
  const pattern = /{{\s*([a-zA-Z0-9_:]+)\s*}}/g;
  const found = new Set();
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;

  for (let p = 1; p <= total; p++) {
    const cl = document.getElementById(`content-layer-${p}`);
    if (!cl) continue;
    // Walk all text and tspan elements
    cl.querySelectorAll("text, tspan").forEach((el) => {
      let src = el.dataset ? el.dataset.rawText || el.textContent : el.textContent;
      let m;
      while ((m = pattern.exec(src)) !== null) {
        found.add(m[1]);
      }
      pattern.lastIndex = 0; // reset for next element
    });
  }

  return [...found].sort();
};

/* ============================================================
   2. AUTO-VARIABLE RESOLUTION
   ============================================================ */

/**
 * resolveAutoVars — builds a partial value map for variables that are
 * computed at merge time (date, page, seq:name).
 * @param {number} pageNo  — current PDF page number (for {{page}})
 * @param {boolean} commit — if true, sequences are incremented; if false (preview) they are not
 * @returns {Object} partial map
 */
const _resolveAutoVars = async (pageNo, commit) => {
  const map = {};
  map["date"] = (typeof getCurrentDate === "function") ? getCurrentDate() : new Date().toLocaleDateString();
  map["page"] = String(pageNo || 1);

  // Collect {{seq:name}} variables from canvas
  const pattern = /{{\s*seq:([a-zA-Z0-9_]+)\s*}}/g;
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  const seqNames = new Set();
  for (let p = 1; p <= total; p++) {
    const cl = document.getElementById(`content-layer-${p}`);
    if (!cl) continue;
    cl.querySelectorAll("text, tspan").forEach((el) => {
      const src = el.dataset ? el.dataset.rawText || el.textContent : el.textContent;
      let m;
      while ((m = pattern.exec(src)) !== null) {
        seqNames.add(m[1]);
      }
      pattern.lastIndex = 0;
    });
  }

  for (const name of seqNames) {
    const seqKey = `seq:${name}`;
    let rec = await getSingleRecordFromDB(name, "printingSequences").catch(() => null);
    if (!rec) {
      map[seqKey] = `{{seq:${name}}}`;
      continue;
    }
    const val = String(rec.next).padStart(rec.pad || 3, "0");
    map[seqKey] = (rec.prefix || "") + val;
    if (commit) {
      rec.next = (rec.next || 1) + 1;
      await saveRecordToDB(rec, "printingSequences").catch(() => {});
      const logRecord = {
        id: crypto.randomUUID(),
        entry: `Sequence ${name} → ${map[seqKey]}`,
        timeStamp: new Date().toISOString(),
      };
      await saveRecordToDB(logRecord, "printingAuditLogs").catch(() => {});
    }
  }

  return map;
};

/* ============================================================
   3. APPLY VARIABLES
   ============================================================ */

/**
 * applyVariables — replaces {{variable_name}} in all text elements.
 *
 * @param {Object}  valueMap  — { variableName: "value", ... }
 * @param {Element} target    — root element to operate on (defaults to #workspace,
 *                              can be a cloned node for non-destructive use).
 * @param {boolean} commit    — if true, sequence counters are incremented.
 *
 * UNDO CONTRACT: callers doing LIVE replacement must call captureSnapshot() BEFORE
 * calling this function. The Fill Variables modal does this automatically.
 */
const applyVariables = async (valueMap, target, commit = false) => {
  const root = target || document.getElementById("workspace");
  if (!root) return;

  // Merge auto-variables (date, page, seq:*) — do not overwrite explicit caller values
  const autoVars = await _resolveAutoVars(1, commit);
  const mergedMap = Object.assign({}, autoVars, valueMap);

  const pattern = /{{\s*([a-zA-Z0-9_:]+)\s*}}/g;

  root.querySelectorAll("text").forEach((textEl) => {
    // Use rawText as the source of truth (stores the original template text)
    const raw = textEl.dataset.rawText
      || Array.from(textEl.querySelectorAll("tspan")).map((ts) => ts.textContent).join(" ")
      || textEl.textContent;

    const replaced = raw.replace(pattern, (_, key) => {
      return (mergedMap[key] !== undefined) ? mergedMap[key] : `{{${key}}}`;
    });

    if (replaced !== raw) {
      textEl.dataset.rawText = replaced;
      const maxWidth = parseFloat(textEl.dataset.width) || parseFloat(textEl.getAttribute("data-width")) || 100;
      textEl.textContent = "";
      textEl.textContent = replaced;
      if (typeof wrapSvgText === "function") wrapSvgText(textEl, maxWidth);
    }
  });
};

/* ============================================================
   4. FILL-IN FORM (single document)
   ============================================================ */

const openVariableFillModal = () => {
  const vars = extractVariables().filter((v) => !["date", "page"].includes(v) && !v.startsWith("seq:"));
  const modalEl = document.getElementById("variableFillModal");
  if (!modalEl) { showToast("variableFillModal not found in DOM", "danger"); return; }

  const container = document.getElementById("variableFillInputs");
  if (!container) return;

  if (vars.length === 0) {
    container.innerHTML = `<p class="text-muted small">No <code>{{variables}}</code> found on this canvas. Add placeholders to text elements first.</p>`;
  } else {
    container.innerHTML = vars.map((v) => `
      <div class="mb-2">
        <label class="form-label small fw-semibold mb-1">${v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</label>
        <input type="text" class="form-control form-control-sm" id="varFill_${v}" placeholder="{{${v}}}" data-varname="${v}">
      </div>
    `).join("");
  }

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

const applyVariableFill = async () => {
  const inputs = document.querySelectorAll("#variableFillInputs input[data-varname]");
  const valueMap = {};
  inputs.forEach((inp) => {
    if (inp.value.trim()) valueMap[inp.dataset.varname] = inp.value.trim();
  });

  if (Object.keys(valueMap).length === 0) {
    showToast("No values entered", "warning");
    return;
  }

  captureSnapshot(); // BEFORE mutation — undo contract
  await applyVariables(valueMap, null, true);

  bootstrap.Modal.getInstance(document.getElementById("variableFillModal")).hide();
  showToast("Variables applied!", "success");

  const logRecord = {
    id: crypto.randomUUID(),
    entry: `Variables applied: ${Object.keys(valueMap).join(", ")}`,
    timeStamp: new Date().toISOString(),
  };
  await saveRecordToDB(logRecord, "printingAuditLogs").catch(() => {});
};

/* ============================================================
   5. CSV PARSER
   ============================================================ */

/**
 * _parseCSV — hand-rolled CSV parser: handles quoted fields containing
 * commas, double-quote escaping, and both CRLF / LF line endings.
 * First row = headers. Returns { headers: [...], rows: [{...}, ...] }.
 */
const _parseCSV = (text) => {
  // Normalise line endings
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const records = [];
  let i = 0;
  const n = lines.length;

  const parseField = () => {
    if (i >= n) return "";
    if (lines[i] === '"') {
      // Quoted field
      i++; // skip opening quote
      let field = "";
      while (i < n) {
        if (lines[i] === '"') {
          i++;
          if (lines[i] === '"') { field += '"'; i++; } // escaped quote
          else break; // closing quote
        } else {
          field += lines[i++];
        }
      }
      return field;
    } else {
      // Unquoted field
      let field = "";
      while (i < n && lines[i] !== "," && lines[i] !== "\n") {
        field += lines[i++];
      }
      return field;
    }
  };

  while (i < n) {
    const record = [];
    while (true) {
      record.push(parseField());
      if (i < n && lines[i] === ",") { i++; continue; }
      if (i < n && lines[i] === "\n") { i++; break; }
      break; // EOF
    }
    // Skip completely blank rows
    if (record.some((f) => f.trim())) records.push(record);
  }

  if (records.length === 0) return { headers: [], rows: [] };

  const headers = records[0].map((h) => h.trim());
  const rows = records.slice(1).map((record) => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = record[idx] !== undefined ? record[idx] : ""; });
    return obj;
  });

  return { headers, rows };
};

/* ============================================================
   6. MAIL MERGE MODAL
   ============================================================ */

let _mmParsed = null; // { headers, rows } from last CSV parse

const openMailMergeModal = () => {
  const modalEl = document.getElementById("mailMergeModal");
  if (!modalEl) { showToast("mailMergeModal not found in DOM", "danger"); return; }

  // Reset state
  _mmParsed = null;
  const mapArea = document.getElementById("mmMappingArea");
  const previewArea = document.getElementById("mmPreviewArea");
  const progressArea = document.getElementById("mmProgressArea");
  const csvInput = document.getElementById("mmCsvInput");
  if (mapArea) mapArea.innerHTML = "";
  if (previewArea) previewArea.textContent = "";
  if (progressArea) { progressArea.style.display = "none"; }
  if (csvInput) csvInput.value = "";

  new bootstrap.Modal(modalEl).show();
};

const onMmCsvChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const parsed = _parseCSV(ev.target.result);
    _mmParsed = parsed;
    _buildMappingTable(parsed.headers);
  };
  reader.readAsText(file);
};

const _buildMappingTable = (headers) => {
  const mapArea = document.getElementById("mmMappingArea");
  if (!mapArea) return;

  const vars = extractVariables().filter((v) => !["date", "page"].includes(v) && !v.startsWith("seq:"));

  if (vars.length === 0) {
    mapArea.innerHTML = `<p class="text-muted small">No {{variables}} found on canvas.</p>`;
    return;
  }

  const options = ["(auto)", ...headers].map((h) => `<option value="${h}">${h}</option>`).join("");

  mapArea.innerHTML = `
    <p class="small text-muted mb-2">Map template variables → CSV columns:</p>
    <table class="table table-sm table-borderless mb-0">
      <tbody>
        ${vars.map((v) => {
          // Auto-match: case-insensitive exact name
          const autoMatch = headers.find((h) => h.toLowerCase() === v.toLowerCase()) || "(auto)";
          return `<tr>
            <td class="small fw-semibold py-1">{{${v}}}</td>
            <td class="py-1">
              <select class="form-select form-select-sm" id="mmMap_${v}" data-var="${v}">
                ${headers.map((h) => `<option value="${h}"${h === autoMatch ? " selected" : ""}>${h}</option>`).join("")}
              </select>
            </td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
};

const mmPreviewRow = async () => {
  if (!_mmParsed || _mmParsed.rows.length === 0) {
    showToast("Load a CSV first", "warning"); return;
  }
  const valueMap = _buildRowValueMap(_mmParsed.rows[0]);
  const previewArea = document.getElementById("mmPreviewArea");

  // Non-destructive: snapshot, apply, show info, restore
  const snap = _currentAllPagesSnapshot();
  await applyVariables(valueMap, null, false); // commit=false → no seq increment
  if (previewArea) {
    previewArea.textContent = `Preview applied for row 1 (${_mmParsed.rows.length} total rows). Close or Generate to proceed.`;
  }
  showToast("Preview applied (row 1). Click Generate to produce all documents.", "info");

  // Restore after 3 s so user can see it briefly
  setTimeout(() => {
    _applySnapshot(snap);
    if (previewArea) previewArea.textContent = "(Preview restored)";
  }, 3000);
};

const _buildRowValueMap = (row) => {
  const valueMap = {};
  document.querySelectorAll("#mmMappingArea select[data-var]").forEach((sel) => {
    const varName = sel.dataset.var;
    const csvHeader = sel.value;
    if (row[csvHeader] !== undefined) valueMap[varName] = row[csvHeader];
  });
  return valueMap;
};

/* ============================================================
   7. MAIL MERGE — GENERATE
   ============================================================ */

const MAIL_MERGE_ROW_CAP = 200;

const mmGenerate = async (outputMode) => {
  if (!_mmParsed || _mmParsed.rows.length === 0) {
    showToast("No CSV data loaded", "warning"); return;
  }

  const rows = _mmParsed.rows;
  if (rows.length > MAIL_MERGE_ROW_CAP) {
    showToast(`Batch capped at ${MAIL_MERGE_ROW_CAP} rows. ${rows.length - MAIL_MERGE_ROW_CAP} rows skipped.`, "warning");
    rows.splice(MAIL_MERGE_ROW_CAP);
  }

  // Check license trial cap
  if (typeof License !== "undefined" && !License.has("mailMerge")) {
    if (rows.length > 10) {
      showToast("Trial plan: mail merge capped at 10 rows. Upgrade for unlimited.", "warning");
      rows.splice(10);
    }
  }

  const progressBar = document.getElementById("mmProgressBar");
  const progressArea = document.getElementById("mmProgressArea");
  const progressLabel = document.getElementById("mmProgressLabel");
  if (progressArea) progressArea.style.display = "block";

  const originalSnap = _currentAllPagesSnapshot();
  const csvFileName = document.getElementById("mmCsvInput")?.files[0]?.name || "data.csv";

  try {
    if (outputMode === "combined") {
      await _mmGenerateCombined(rows, progressBar, progressLabel);
    } else {
      await _mmGeneratePerRow(rows, progressBar, progressLabel);
    }

    // Restore canvas
    _applySnapshot(originalSnap);

    const logRecord = {
      id: crypto.randomUUID(),
      entry: `Mail merge: ${rows.length} documents from ${csvFileName}`,
      timeStamp: new Date().toISOString(),
    };
    await saveRecordToDB(logRecord, "printingAuditLogs").catch(() => {});

    showToast(`Mail merge complete: ${rows.length} documents`, "success");
    bootstrap.Modal.getInstance(document.getElementById("mailMergeModal"))?.hide();
  } catch (err) {
    console.error("Mail merge error:", err);
    _applySnapshot(originalSnap);
    showToast("Mail merge failed: " + err.message, "danger");
  } finally {
    if (progressArea) progressArea.style.display = "none";
  }
};

const _setProgress = (bar, label, current, total) => {
  const pct = Math.round((current / total) * 100);
  if (bar) { bar.style.width = pct + "%"; bar.textContent = pct + "%"; }
  if (label) label.textContent = `Processing row ${current} of ${total}…`;
};

const _mmGenerateCombined = async (rows, progressBar, progressLabel) => {
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  const pageSize = window.sessionStorage.getItem("pageSize") || "A4";
  const { width: pdfW, height: pdfH } = pageDimensions[pageSize];
  const orientation = pdfW > pdfH ? "l" : "p";
  const wantVector = localStorage.getItem("vectorPdfExport") === "true";

  const { jsPDF } = window.jspdf;
  let pdf = new jsPDF(orientation, "mm", [pdfW, pdfH]);
  let firstPage = true;

  for (let i = 0; i < rows.length; i++) {
    _setProgress(progressBar, progressLabel, i + 1, rows.length);
    const valueMap = _buildRowValueMap(rows[i]);
    await applyVariables(valueMap, null, true); // commit = true

    if (!firstPage) pdf.addPage([pdfW, pdfH], orientation);
    firstPage = false;

    if (wantVector && typeof pdf.svg === "function") {
      await _exportVectorPDFPage(pdf, 1, pdfW, pdfH);
      for (let p = 2; p <= total; p++) {
        pdf.addPage([pdfW, pdfH], orientation);
        await _exportVectorPDFPage(pdf, p, pdfW, pdfH);
      }
    } else {
      await _exportRasterPDFPages(pdf, total, pdfW, pdfH, orientation, i < rows.length - 1);
    }

    // yield to event loop so progress bar paints
    await new Promise((r) => setTimeout(r, 0));
  }

  pdf.save("mail-merge-combined.pdf");
};

const _mmGeneratePerRow = async (rows, progressBar, progressLabel) => {
  const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;
  const pageSize = window.sessionStorage.getItem("pageSize") || "A4";
  const { width: pdfW, height: pdfH } = pageDimensions[pageSize];
  const orientation = pdfW > pdfH ? "l" : "p";
  const wantVector = localStorage.getItem("vectorPdfExport") === "true";

  for (let i = 0; i < rows.length; i++) {
    _setProgress(progressBar, progressLabel, i + 1, rows.length);
    const valueMap = _buildRowValueMap(rows[i]);
    await applyVariables(valueMap, null, true);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF(orientation, "mm", [pdfW, pdfH]);

    if (wantVector && typeof pdf.svg === "function") {
      await _exportVectorPDFPage(pdf, 1, pdfW, pdfH);
      for (let p = 2; p <= total; p++) {
        pdf.addPage([pdfW, pdfH], orientation);
        await _exportVectorPDFPage(pdf, p, pdfW, pdfH);
      }
    } else {
      await _exportRasterPDFPages(pdf, total, pdfW, pdfH, orientation, false);
    }

    // Derive filename from recipient_name or row index
    const recName = valueMap["recipient_name"] || valueMap["name"] || `row-${i + 1}`;
    const safeName = recName.replace(/[^a-zA-Z0-9-_]/g, "_");
    pdf.save(`${safeName}.pdf`);

    await new Promise((r) => setTimeout(r, 50)); // brief pause between downloads
  }
};

/**
 * _exportVectorPDFPage — export a single SVG page group into an existing pdf.
 * Mirrors _exportVectorPDF from scripts.js but operates on ONE page and uses
 * a provided pdf instance (no save).
 */
const _exportVectorPDFPage = async (pdf, pageNo, pdfW, pdfH) => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const pageGroup = document.getElementById(`pageGroup-${pageNo}`);
  if (!pageGroup) return;

  const clone = pageGroup.cloneNode(true);
  clone.removeAttribute("transform");
  clone.querySelectorAll(
    ".img-resize-handle, .svg-table-grip, .page-watermark, " +
    ".text-highlight, .cell-edit-fo, [id^='grid-layer'], [id^='safeZone']"
  ).forEach((n) => n.remove());

  const tmp = document.createElementNS(SVG_NS, "svg");
  tmp.setAttribute("xmlns", SVG_NS);
  tmp.setAttribute("viewBox", `0 0 ${pdfW} ${pdfH}`);
  tmp.setAttribute("width", `${pdfW}mm`);
  tmp.setAttribute("height", `${pdfH}mm`);
  tmp.style.position = "absolute";
  tmp.style.left = "-10000px";
  tmp.appendChild(clone);
  document.body.appendChild(tmp);
  try {
    await pdf.svg(tmp, { x: 0, y: 0, width: pdfW, height: pdfH });
  } finally {
    tmp.remove();
  }
};

/**
 * _exportRasterPDFPages — captures the canvas and appends pages to an existing
 * pdf instance. skipFirstPageAdd=true when caller already added the first page.
 */
const _exportRasterPDFPages = async (pdf, total, pdfW, pdfH, orientation, skipFirstPageAdd) => {
  const pageEl = document.getElementById("canvas");
  document.body.classList.add("export-mode");
  const prevTransform = pageEl.style.transform;
  pageEl.style.transform = "none";
  try {
    const capture = await html2canvas(pageEl, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      ignoreElements: (el) => {
        return (
          ["rulers-layer", "grid-layer", "contextMenu", "imageInput"].includes(el.id) ||
          el.classList.contains("grid-style") ||
          el.classList.contains("img-resize-handle") ||
          el.classList.contains("svg-table-grip") ||
          el.classList.contains("page-watermark")
        );
      },
    });

    const RULER_SIZE_MM = typeof RULER_SIZE_MM !== "undefined" ? window.RULER_SIZE_MM : 10;
    const svgWmm = pdfW + RULER_SIZE_MM + 5;
    const pxPerMm = capture.width / svgWmm;

    for (let p = 1; p <= total; p++) {
      if (p > 1 || skipFirstPageAdd) pdf.addPage([pdfW, pdfH], orientation);
      const offsetY = (typeof getPageOffsetY === "function") ? getPageOffsetY(p, pdfH) : ((p - 1) * (pdfH + 15) + 10);
      const sx = RULER_SIZE_MM * pxPerMm;
      const sy = offsetY * pxPerMm;
      const sw = pdfW * pxPerMm;
      const sh = pdfH * pxPerMm;
      const slice = document.createElement("canvas");
      slice.width = Math.round(sw);
      slice.height = Math.round(sh);
      const ctx = slice.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(capture, sx, sy, sw, sh, 0, 0, slice.width, slice.height);
      pdf.addImage(slice.toDataURL("image/png", 1.0), "PNG", 0, 0, pdfW, pdfH, undefined, "FAST");
    }
  } finally {
    document.body.classList.remove("export-mode");
    pageEl.style.transform = prevTransform;
  }
};

/* ============================================================
   8. BARCODE REGENERATION (called by mail merge for §4)
   ============================================================ */

/**
 * regenerateBarcodes — after applying valueMap to a merged page, re-generates
 * any barcode/QR image groups whose source text contained variables.
 * Called automatically by applyVariables when §4 barcodes are present.
 */
const regenerateBarcodes = (valueMap) => {
  const pattern = /{{\s*([a-zA-Z0-9_:]+)\s*}}/g;
  document.querySelectorAll("[data-barcode-src], [data-qr-src]").forEach((group) => {
    const src = group.dataset.barcodeSrc || group.dataset.qrSrc;
    if (!src || !src.match(pattern)) return; // no variables → skip

    const resolved = src.replace(pattern, (_, key) => valueMap[key] || `{{${key}}}`);
    const imgEl = group.querySelector("image");
    if (!imgEl) return;

    if (group.dataset.barcodeSrc) {
      // Regenerate barcode (§4 will implement the full renderer; stub here)
      if (typeof _generateBarcodeDataUrl === "function") {
        _generateBarcodeDataUrl(resolved, group.dataset.barcodeType || "CODE128").then((url) => {
          imgEl.setAttribute("href", url);
        });
      }
    } else {
      // Regenerate QR
      if (typeof _generateQrDataUrl === "function") {
        _generateQrDataUrl(resolved).then((url) => {
          imgEl.setAttribute("href", url);
        });
      }
    }
  });
};

/* ============================================================
   9. SEQUENCES MANAGER UI
   ============================================================ */

const openSequenceManager = async () => {
  const seqs = await getAllRecordsFromDB("printingSequences").catch(() => []);
  const container = document.getElementById("seqManagerList");
  if (!container) return;

  if (seqs.length === 0) {
    container.innerHTML = `<p class="text-muted small">No sequences defined yet. Create one below.</p>`;
  } else {
    container.innerHTML = seqs.map((s) => `
      <div class="d-flex align-items-center gap-2 mb-2 border rounded px-2 py-1">
        <code class="flex-grow-1 small">{{seq:${s.id}}}</code>
        <span class="small text-muted">${s.prefix || ""}${String(s.next || 1).padStart(s.pad || 3, "0")}</span>
        <input type="number" class="form-control form-control-sm" style="width:70px;"
               value="${s.next || 1}" title="Reset next value"
               onchange="seqUpdateNext('${s.id}', this.value)">
        <button class="btn btn-sm btn-outline-danger" onclick="seqDelete('${s.id}')">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join("");
  }
};

const seqCreate = async () => {
  const nameEl = document.getElementById("seqNewName");
  const prefixEl = document.getElementById("seqNewPrefix");
  const padEl = document.getElementById("seqNewPad");

  const name = nameEl?.value.trim().replace(/[^a-zA-Z0-9_]/g, "_");
  if (!name) { showToast("Sequence name required", "warning"); return; }

  const rec = {
    id: name,
    prefix: prefixEl?.value.trim() || "",
    pad: parseInt(padEl?.value || "3"),
    next: 1,
  };

  await saveRecordToDB(rec, "printingSequences");
  if (nameEl) nameEl.value = "";
  if (prefixEl) prefixEl.value = "";
  showToast(`Sequence "${name}" created`, "success");
  await openSequenceManager();
};

const seqUpdateNext = async (id, val) => {
  const rec = await getSingleRecordFromDB(id, "printingSequences").catch(() => null);
  if (!rec) return;
  rec.next = parseInt(val, 10) || 1;
  await saveRecordToDB(rec, "printingSequences");
  showToast(`Sequence "${id}" reset to ${rec.next}`, "success");
};

const seqDelete = async (id) => {
  await deleteSingleRecordFromDB(id, "printingSequences").catch(() => {});
  showToast(`Sequence "${id}" deleted`, "success");
  await openSequenceManager();
};
