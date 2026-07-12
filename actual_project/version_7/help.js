//

const helpSection = {
  index: [
    "1. Page Setup — Select page size and view dimensions.",
    "2. Pointer Coordinates — Track cursor position in real-time.",
    "3. Document Preset — Load templates, create custom templates, and save versions.",
    "4. Document Elements — Add TextBox, ImageBox, Table, Shapes, Barcodes, or QR codes to the active page.",
    "5. Pages — Add / remove pages, and track element counts across all pages.",
    "6. Zoom Controls — Zoom in, out, or reset to fit.",
    "7. Grid Controls — Show / hide grid and snap-to-grid controls.",
    "8. Safe Zone Controls — Show / hide and resize the safe print zone.",
    "9. Printing and Export — Preview, export to PDF, and import / export raw files.",
    "10. App Space Usage — Monitor IndexedDB storage consumption.",
    "11. Version History — Browse and restore previous canvas snapshots.",
    "12. Audit History — Inspect a ledger of all changes made to the document.",
    "13. Workflow — Step-by-step guide to creating and printing a document.",
    "14. Shapes & Lines — Add rectangles, ellipses and lines; resize, recolour, set thickness, corner radius and rotation.",
    "15. Barcodes & QR — Insert CODE128 / EAN barcodes and QR codes from text or variables.",
    "16. 3D Layers View — Inspect the document as stacked 3D layers (Show Layers button) with Layers / 3D-Space modes.",
    "17. Approval Workflow — Admin Approve / Revoke; a DRAFT watermark stamps exports until approved.",
  ],
  leftHandSide: [
    {
      question: "1. What is Page Setup?",
      answer:
        "Page Setup displays the current page size selection (A4, A5, C4, DL, C5, Num10 envelope) and shows the exact width and height of the selected page in millimetres.",
    },
    {
      question: "2. What are Pointer Coordinates?",
      answer:
        "Pointer Coordinates show the exact X and Y position of your mouse cursor within the workspace canvas, updated in real time and expressed in millimetres.",
    },
    {
      question: "3. What is Document Preset?",
      answer:
        "Document Preset lets you set the document type (Letter, Invoice, Envelope), load a saved template from the gallery, create your own custom template by defining element positions, and save the current canvas as a named version.",
    },
    {
      question: "4. What is Document Elements?",
      answer:
        "Document Elements provides one-click buttons to add a TextBox, ImageBox, Table, Shape (rectangle, ellipse or line via the Shape dropdown), Barcode, or QR code to the currently active page. It also lets you lock all elements in place and reset (clear) the entire canvas.",
    },
    {
      question: "5. What is Zoom Controls?",
      answer:
        "Zoom Controls lets you increase or decrease the visual magnification of the workspace canvas. The current zoom percentage is displayed as a badge. Reset Zoom returns to 100 %.",
    },
    {
      question: "6. What is Grid Controls?",
      answer:
        "Grid Controls lets you toggle the grid overlay on and off, change the grid cell size (5 mm, 10 mm, 20 mm), and enable snap-to-grid so dragged elements automatically align to the nearest grid point.",
    },
    {
      question: "7. What is Safe Zone Controls?",
      answer:
        "Safe Zone Controls overlays a dashed rectangle representing the printable area. Keeping elements inside this boundary ensures they are not cut off by the printer margins.",
    },
    {
      question: "8. What is Printing and Export?",
      answer:
        "Printing and Export lets you preview the document at reduced zoom, export to a PDF file, export the raw canvas data (JSON or SVG), and import a previously exported raw file to restore a session.",
    },
    {
      question: "9. How do Shapes & Lines work?",
      answer:
        "Use the 'Add Shape' dropdown to insert a Rectangle, Ellipse, or Line. Every shape has a grip 'holder' bar at the top — like a table — so it is easy to grab and move, and a faint dashed border connects its corner handles. Drag the corner squares to resize (line endpoints for a line). Right-click inside a rectangle or ellipse (or use the line's top grip bar) to open the context menu, where you can set stroke colour, fill colour, stroke thickness (mm), corner radius (rectangles) and rotation angle.",
    },
    {
      question: "10. How do I add Barcodes and QR codes?",
      answer:
        "Click 'Add Barcode' or 'Add QR' in Document Elements. Enter the content (plain text or a {{variable}}), pick the barcode type and size, then confirm. The code is generated and placed as an image you can move and resize. When used in mail merge, codes whose content contains variables are regenerated per row.",
    },
    {
      question: "11. What is the 3D Layers View?",
      answer:
        "The 'Show Layers' button (top of the canvas) opens a full-screen 3D view of your document below the navbar — every element is rendered as an opaque coloured card stacked by paint order, so overlapping elements are easy to spot (Text = blue, Image = purple, Table = green, Shape = orange). Drag to orbit, scroll or use the on-screen Zoom +/- buttons to zoom, and use the page ◀ ▶ arrows (or keys 1–9) to move between pages. The Undo / Redo / Zoom / Page buttons float on the left; on the right you can toggle 'Show chrome', switch between 'Layers' and '3D Space' modes, and Hide Layers (or press Esc). Click a card to inspect an element; double-click to jump to it on the 2D canvas.",
    },
    {
      question: "12. What are the 3D view modes (Layers vs 3D Space)?",
      answer:
        "Layers mode shows the exploded stack of element cards. 3D Space mode adds coloured X/Y/Z coordinate axes, a bounding box around the whole render and a faint floor grid, so you can read true positions in millimetres. Switch modes from the toggle in the 3D view or from Settings → '3D Coordinate Space (axes)'.",
    },
    {
      question: "13. What is the Approval Workflow?",
      answer:
        "Administrators see 'Approve' and 'Revoke' actions (one below the other) in the left panel. Approving locks all elements and records who approved it; revoking unlocks them again. Until a document is approved it is treated as a Draft — a faint diagonal 'DRAFT' watermark is stamped on every exported PDF page, and a DRAFT badge shows on each page in the editor.",
    },
  ],
  rightHandSide: [
    {
      question: "1. What is App Space Usage?",
      answer:
        "App Space Usage displays how much of your browser's IndexedDB storage has been used by the app versus the total available quota. A generous limit is provided by default.",
    },
    {
      question: "2. What is App Downloads?",
      answer:
        "App Downloads offers one-click buttons to download the full Help Manual and the Audit Log as styled PDF files for offline reference.",
    },
    {
      question: "3. What is Version History?",
      answer:
        "Version History shows a chronological list of canvas snapshots you have saved via 'Save Current Version'. Click any entry to restore that canvas state.",
    },
    {
      question: "4. What is Audit History?",
      answer:
        "Audit History is an automatic ledger that records every significant action — elements added, templates saved, versions restored — with a timestamp, so you can trace changes over time.",
    },
  ],
  workflow: [
    {
      step: "Step 1 — Select a Page Size",
      detail:
        "Open the Page Setup panel on the left and choose a page size (e.g. A4). The canvas and rulers update immediately to reflect the chosen dimensions.",
    },
    {
      step: "Step 2 — Set a Document Type (optional)",
      detail:
        "In Document Preset, choose a document type such as Letter or Invoice. This categorises your work but does not change the page layout.",
    },
    {
      step: "Step 3 — Load or Create a Template (optional)",
      detail:
        "Click 'Add from Gallery' to load a saved template onto the canvas. Alternatively, click 'Create Own Template' to define a new template by specifying text, image, and table element positions manually.",
    },
    {
      step: "Step 4 — Add Elements to the Canvas",
      detail:
        "Use the Document Elements panel to add TextBoxes, ImageBoxes, or Tables. Elements are placed on the currently active page. Switch active pages by clicking a page on the canvas; the page number badge in the Pages panel shows which page is active.",
    },
    {
      step: "Step 5 — Position and Style Elements",
      detail:
        "Drag elements freely on the canvas. Right-click (or long-press on touch) any element to open its context menu, where you can edit text content, font size, bold / italic, image dimensions, table rows / columns, layer order, and page alignment.",
    },
    {
      step: "Step 6 — Use the Grid and Safe Zone for Precision",
      detail:
        "Enable the grid and Snap to Grid for accurate positioning. Toggle the Safe Zone overlay to ensure no element crosses the printer margin boundary.",
    },
    {
      step: "Step 7 — Add More Pages (if needed)",
      detail:
        "Use the Pages panel to add up to 5 pages. Each page has its own content layer. Elements added via Document Elements go to the currently active page only.",
    },
    {
      step: "Step 8 — Save a Version",
      detail:
        "Click 'Save Current Version' to snapshot the entire multi-page canvas to Version History. You can restore any snapshot later without losing subsequent work.",
    },
    {
      step: "Step 9 — Add Shapes, Barcodes or QR codes (optional)",
      detail:
        "Use the 'Add Shape' dropdown for a rectangle, ellipse or line — grab the top holder bar to move it, drag the corner squares to resize, and right-click inside (or use a line's top bar) to set colour, thickness, corner radius and rotation. Use 'Add Barcode' / 'Add QR' to insert scannable codes from text or a {{variable}}.",
    },
    {
      step: "Step 10 — Inspect in 3D (optional)",
      detail:
        "Click 'Show Layers' to open the 3D layers view. Orbit by dragging, zoom with the +/- buttons or scroll, and page through with the ◀ ▶ arrows. Toggle 'Layers' vs '3D Space' (axes + grid) to check element stacking and true positions. Click a card to inspect it; press Esc or 'Hide Layers' to return.",
    },
    {
      step: "Step 11 — Approve (admin) and Preview / Export",
      detail:
        "Admins can click 'Approve' to lock the document (or 'Revoke' to reopen it). Until approved, exports carry a faint DRAFT watermark. Click 'Preview Document', then 'Print Document' to export a PDF, or 'Export RAW File' to save a JSON copy for re-import.",
    },
  ],
};

/* ============================
   RENDER FUNCTIONS — STYLED
============================= */

/** Shared: renders a list of items as numbered-circle cards — same as workflow style. */
const _renderNumberedList = (items, containerId, labelKey, detailKey) => {
  let html = `<ol class="list-unstyled mb-0">`;
  items.forEach((item, idx) => {
    const label  = typeof item === "string" ? item : item[labelKey]  || "";
    const detail = typeof item === "string" ? ""   : item[detailKey] || "";
    html += `
    <li class="help-workflow-item d-flex gap-3 mb-3">
      <div class="help-workflow-number flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
           style="width:28px;height:28px;font-size:0.75rem;">${idx + 1}</div>
      <div>
        <p class="fw-semibold mb-1" style="font-size:0.85rem;">${label}</p>
        ${detail ? `<p class="text-muted mb-0" style="font-size:0.8rem;">${detail}</p>` : ""}
      </div>
    </li>`;
  });
  html += `</ol>`;
  document.getElementById(containerId).innerHTML = html;
};

const renderHelpIndexSectionHtml = () =>
  _renderNumberedList(helpSection["index"], "helpIndexSection");

const renderHelpLeftHandSideSectionHtml = () =>
  _renderNumberedList(helpSection["leftHandSide"], "helpLeftHandSideSection", "question", "answer");

const renderHelpRightHandSideSectionHtml = () =>
  _renderNumberedList(helpSection["rightHandSide"], "helpRightHandSideSection", "question", "answer");

const renderWorkflowSectionHtml = () => {
  let html = `<ol class="list-unstyled mb-0">`;
  helpSection["workflow"].forEach((item, idx) => {
    html += `
    <li class="help-workflow-item d-flex gap-3 mb-3">
      <div class="help-workflow-number flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
           style="width:28px;height:28px;font-size:0.75rem;">${idx + 1}</div>
      <div>
        <p class="fw-semibold mb-1" style="font-size:0.85rem;">${item.step}</p>
        <p class="text-muted mb-0" style="font-size:0.8rem;">${item.detail}</p>
      </div>
    </li>`;
  });
  html += `</ol>`;
  document.getElementById("workflowSection").innerHTML = html;
};

/* ============================
   PDF DOWNLOADS — STYLED
============================= */

const _pdfHeader = (doc, title, subtitle = "") => {
  const pageWidth = doc.internal.pageSize.getWidth();
  // Blue header band
  doc.setFillColor(13, 110, 253);
  doc.rect(0, 0, pageWidth, 28, "F");
  // App name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("Printing App 2026", 14, 12);
  // Document title
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 21);
  if (subtitle) {
    doc.setFontSize(8);
    doc.text(subtitle, pageWidth - 14, 21, { align: "right" });
  }
  // Reset text colour
  doc.setTextColor(0, 0, 0);
  return 38; // starting Y after header
};

const _pdfSectionTitle = (doc, text, y, pageWidth) => {
  doc.setFillColor(240, 245, 255);
  doc.rect(14, y - 4, pageWidth - 28, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(13, 110, 253);
  doc.text(text, 16, y + 2);
  doc.setTextColor(0, 0, 0);
  return y + 10;
};

const _pdfCheckNewPage = (doc, y, margin, pageHeight, newPageFn) => {
  if (y > pageHeight - 25) {
    doc.addPage();
    return newPageFn(doc);
  }
  return y;
};

const _pdfPageNumber = (doc) => {
  const total = doc.internal.getNumberOfPages();
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${total}`, pageWidth - 14, pageHeight - 8, { align: "right" });
    doc.text("Printing App 2026 — Help Manual", 14, pageHeight - 8);
    // Bottom rule
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
  }
};

const downloadHelpManual = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  const generated = new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

  let y = _pdfHeader(doc, "Help Manual", `Generated: ${generated}`);

  const newPageY = (d) => {
    d.setFillColor(13, 110, 253);
    d.rect(0, 0, pageWidth, 14, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(9); d.setTextColor(255, 255, 255);
    d.text("Printing App 2026 — Help Manual (continued)", margin, 9);
    d.setTextColor(0, 0, 0);
    return 22;
  };

  // Index section
  y = _pdfSectionTitle(doc, "Index", y, pageWidth);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  helpSection.index.forEach((item) => {
    y = _pdfCheckNewPage(doc, y, margin, pageHeight, newPageY);
    const lines = doc.splitTextToSize(`• ${item}`, maxWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5.5;
  });

  y += 6;

  // Left Hand Side
  y = _pdfCheckNewPage(doc, y, margin, pageHeight, newPageY);
  y = _pdfSectionTitle(doc, "Left Side Menu", y, pageWidth);
  helpSection.leftHandSide.forEach((item) => {
    y = _pdfCheckNewPage(doc, y, margin, pageHeight, newPageY);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(13, 110, 253);
    const qLines = doc.splitTextToSize(item.question, maxWidth);
    doc.text(qLines, margin, y); y += qLines.length * 5.5 + 1;

    y = _pdfCheckNewPage(doc, y, margin, pageHeight, newPageY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 60);
    const aLines = doc.splitTextToSize(item.answer, maxWidth - 6);
    doc.text(aLines, margin + 4, y); y += aLines.length * 5 + 6;
  });

  // Right Hand Side
  y = _pdfCheckNewPage(doc, y, margin, pageHeight, newPageY);
  y = _pdfSectionTitle(doc, "Right Side Menu", y, pageWidth);
  helpSection.rightHandSide.forEach((item) => {
    y = _pdfCheckNewPage(doc, y, margin, pageHeight, newPageY);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(13, 110, 253);
    const qLines = doc.splitTextToSize(item.question, maxWidth);
    doc.text(qLines, margin, y); y += qLines.length * 5.5 + 1;

    y = _pdfCheckNewPage(doc, y, margin, pageHeight, newPageY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 60);
    const aLines = doc.splitTextToSize(item.answer, maxWidth - 6);
    doc.text(aLines, margin + 4, y); y += aLines.length * 5 + 6;
  });

  // Workflow
  y = _pdfCheckNewPage(doc, y, margin, pageHeight, newPageY);
  y = _pdfSectionTitle(doc, "Workflow", y, pageWidth);
  helpSection.workflow.forEach((item, idx) => {
    y = _pdfCheckNewPage(doc, y, margin, pageHeight, newPageY);
    // Step circle
    doc.setFillColor(13, 110, 253);
    doc.circle(margin + 3, y - 1, 2.5, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
    doc.text(`${idx + 1}`, margin + 3, y + 0.5, { align: "center" });
    // Step title
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(30, 30, 30);
    doc.text(item.step, margin + 8, y); y += 5.5;

    y = _pdfCheckNewPage(doc, y, margin, pageHeight, newPageY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(70, 70, 70);
    const dLines = doc.splitTextToSize(item.detail, maxWidth - 12);
    doc.text(dLines, margin + 8, y); y += dLines.length * 5 + 6;
  });

  _pdfPageNumber(doc);
  doc.save("help_manual.pdf");
};

const downloadAuditLog = async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  const generated = new Date().toLocaleString();

  let y = _pdfHeader(doc, "Audit Log Export", `Generated: ${generated}`);

  const newPageY = (d) => {
    d.setFillColor(13, 110, 253);
    d.rect(0, 0, pageWidth, 14, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(9); d.setTextColor(255, 255, 255);
    d.text("Printing App 2026 — Audit Log (continued)", margin, 9);
    d.setTextColor(0, 0, 0);
    return 22;
  };

  const items = await getAllRecordsFromDB("printingAuditLogs");

  if (items.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("No audit log entries found.", margin, y);
  } else {
    // Table header
    const colW1 = maxWidth * 0.65;
    const colW2 = maxWidth * 0.35;
    const rowH  = 8;

    doc.setFillColor(13, 110, 253);
    doc.rect(margin, y - 5, maxWidth, rowH, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text("Entry", margin + 2, y);
    doc.text("Timestamp", margin + colW1 + 2, y);
    y += rowH - 2;

    items.forEach((item, index) => {
      y = _pdfCheckNewPage(doc, y, margin, pageHeight, newPageY);

      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(245, 248, 255);
        doc.rect(margin, y - 5, maxWidth, rowH, "F");
      }

      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(30, 30, 30);
      const entryLines = doc.splitTextToSize(item.entry || "—", colW1 - 4);
      doc.text(entryLines, margin + 2, y);

      doc.setTextColor(90, 90, 90);
      const tsText = item.timeStamp
        ? new Date(item.timeStamp).toLocaleString()
        : "—";
      doc.text(tsText, margin + colW1 + 2, y, { maxWidth: colW2 - 4 });

      y += Math.max(entryLines.length * 5, rowH - 2);

      // Light row separator
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.2);
      doc.line(margin, y - 1, margin + maxWidth, y - 1);
    });
  }

  // Footer with total count
  doc.addPage();
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(13, 110, 253);
  doc.text(`Total entries: ${items.length}`, margin, 20);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
  doc.text(`Exported on ${generated}`, margin, 28);

  // Add page numbers to all pages (overwrite footer)
  const totalPgs = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPgs; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.text(`Page ${i} of ${totalPgs}`, pw - margin, ph - 8, { align: "right" });
    doc.text("Printing App 2026 — Audit Log", margin, ph - 8);
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
    doc.line(margin, ph - 12, pw - margin, ph - 12);
  }

  doc.save("audit_log_export.pdf");
};

//

renderHelpIndexSectionHtml();
renderHelpLeftHandSideSectionHtml();
renderHelpRightHandSideSectionHtml();
renderWorkflowSectionHtml();
