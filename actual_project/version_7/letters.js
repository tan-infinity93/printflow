/*
  - This file contains logic for Letter based Logic:
  - This module is imported after scripts.js in html file and hence all functions are available in
    global scope to be used here directly.
*/

/* ===========================
   CONSTANTS & STATE
=========================== */

const getCurrentDate = () => {
  const today = new Date();
  const options = { year: "numeric", month: "long", day: "numeric" };

  // "January 17, 2026"
  const displayDate = new Intl.DateTimeFormat("en-US", options).format(today);
  return displayDate;
};

const LETTER_LAYOUT_ELEMENTS = {
  A4: [
    {
      type: "text",
      role: "sender",
      x: 15,
      y: 20,
      w: 90,
      textContent: `{{sender_name}}
{{sender_title}}, {{sender_company}}
{{sender_address}}
{{sender_email}}
{{date}}`,
    },
    {
      type: "text",
      role: "recipient",
      x: 15,
      y: 60,
      w: 90,
      textContent: `{{recipient_name}}
{{recipient_title}}, {{recipient_company}}
{{recipient_address}}`,
    },
    {
      type: "text",
      role: "subject",
      x: 15,
      y: 100,
      w: 190,
      textContent: `Subject: {{subject}}`,
    },
    {
      type: "text",
      role: "body",
      x: 15,
      y: 115,
      w: 180,
      textContent: `Dear {{recipient_name}},
{{body}}`,
    },
    {
      type: "text",
      role: "footer",
      x: 15,
      y: 250,
      w: 90,
      textContent: `Sincerely,
{{sender_name}}
{{sender_title}}`,
    },
  ],
  A5: [
    {
      type: "text",
      role: "sender",
      x: 15,
      y: 20,
      w: 90,
      textContent: `
{{sender_name}}
{{sender_title}}, {{sender_company}}
{{sender_address}}
{{sender_email}}
{{date}}
      `,
    },
    {
      type: "text",
      role: "recipient",
      x: 15,
      y: 55,
      w: 90,
      textContent: `
{{recipient_name}}
{{recipient_title}}, {{recipient_company}}
{{recipient_address}}
      `,
    },
    {
      type: "text",
      role: "subject",
      x: 15,
      y: 75,
      w: 110,
      textContent: `
Subject: {{subject}}
      `,
    },
    {
      type: "text",
      role: "body",
      x: 15,
      y: 85,
      w: 110,
      textContent: `
Dear {{recipient_name}},
{{body}}
      `,
    },
    {
      type: "text",
      role: "footer",
      x: 15,
      y: 185,
      w: 90,
      textContent: `
Sincerely,
{{sender_name}}
{{sender_title}}
      `,
    },
  ],
  C4: [
    {
      type: "text",
      role: "sender",
      x: 15,
      y: 20,
      w: 90,
      textContent: `
{{sender_name}}
{{sender_title}}, {{sender_company}}
{{sender_address}}
{{sender_email}}
{{date}}
      `,
    },
    {
      type: "text",
      role: "recipient",
      x: 15,
      y: 60,
      w: 90,
      textContent: `
{{recipient_name}}
{{recipient_title}}, {{recipient_company}}
{{recipient_address}}
      `,
    },
    {
      type: "text",
      role: "subject",
      x: 15,
      y: 100,
      w: 190,
      textContent: `
Subject: {{subject}}
      `,
    },
    {
      type: "text",
      role: "body",
      x: 15,
      y: 125,
      w: 180,
      textContent: `
Dear {{recipient_name}},
{{body}}
      `,
    },
    {
      type: "text",
      role: "footer",
      x: 15,
      y: 260,
      w: 90,
      textContent: `
Sincerely,
{{sender_name}}
{{sender_title}}
      `,
    },
  ],
};

const INVOICE_LAYOUT_ELEMENTS = {
  A4: [
    {
      type: "text",
      role: "invoice_title",
      x: 15,
      y: 20,
      w: 50,
      textContent: `
      INVOICE
      Original Copy
      `,
    },
    {
      type: "text",
      role: "seller_block",
      x: 15,
      y: 50,
      w: 90,
      textContent: `
{{brand_company}}
{{brand_address}}
GSTIN: {{gstin}}
Email: {{brand_email}}
      `,
    },
    {
      type: "text",
      role: "invoice_meta",
      x: 120,
      y: 20,
      w: 90,
      textContent: `
Invoice Number: {{invoice_number}}
Invoice Date: {{date}}
Due Date: {{due_date}}
      `,
    },
    {
      type: "text",
      role: "buyer_block",
      x: 15,
      y: 80,
      w: 100,
      textContent: `
BILL TO:
{{recipient_company}}
Attn: {{recipient_name}}
{{recipient_address}}
      `,
    },
    {
      type: "text",
      role: "items_header",
      x: 15,
      y: 120,
      w: 170,
      textContent: `
      Description | Quantity | Unit Price | Total
      `,
    },
    {
      type: "text",
      role: "item_row",
      x: 15,
      y: 130,
      w: 170,
      textContent: `
      1. UI/UX Redesign - Project Alpha (Dashboard) | 1 | ₹4,500.00 | ₹4,500.00
      2. Custom Widget Component Library (JS/CSS) | 1 | ₹1,200.00 | ₹1,200.00
      `,
    },
    {
      type: "text",
      role: "totals_block",
      x: 120,
      y: 180,
      w: 80,
      textContent: `
      Subtotal: ₹5,700.00
      Tax (10%): ₹570.00
      TOTAL AMOUNT DUE: ₹6,270.00
      `,
    },
    {
      type: "text",
      role: "notes",
      x: 15,
      y: 250,
      w: 180,
      textContent: `
      Notes: Please include the invoice number in your bank transfer reference. Standard 30-day payment terms apply. Thank you for your business.
      `,
    },
    {
      type: "text",
      role: "signature",
      x: 140,
      y: 270,
      w: 90,
      textContent: `
Authorized Signatory:
{{sender_name}}
({{brand_company}})
      `,
    },
  ],
  A5: [
    {
      type: "text",
      role: "invoice_title",
      x: 15,
      y: 20,
      w: 50,
      textContent: `
      INVOICE
      Original Copy
      `,
    },
    {
      type: "text",
      role: "seller_block",
      x: 15,
      y: 50,
      w: 90,
      textContent: `
{{brand_company}}
{{brand_address}}
GSTIN: {{gstin}}
Email: {{brand_email}}
      `,
    },
    {
      type: "text",
      role: "invoice_meta",
      x: 85,
      y: 20,
      w: 90,
      textContent: `
Invoice Number: {{invoice_number}}
Invoice Date: {{date}}
Due Date: {{due_date}}
      `,
    },
    {
      type: "text",
      role: "buyer_block",
      x: 15,
      y: 80,
      w: 100,
      textContent: `
BILL TO:
{{recipient_company}}
Attn: {{recipient_name}}
{{recipient_address}}
      `,
    },
    {
      type: "text",
      role: "items_header",
      x: 15,
      y: 120,
      w: 170,
      textContent: `
      Description | Quantity | Unit Price | Total
      `,
    },
    {
      type: "text",
      role: "item_row",
      x: 15,
      y: 130,
      w: 170,
      textContent: `
      1. UI/UX Redesign - Project Alpha (Dashboard) | 1 | ₹4,500.00 | ₹4,500.00
      2. Custom Widget Component Library (JS/CSS) | 1 | ₹1,200.00 | ₹1,200.00
      `,
    },
    {
      type: "text",
      role: "totals_block",
      x: 85,
      y: 180,
      w: 80,
      textContent: `
      Subtotal: ₹5,700.00
      Tax (10%): ₹570.00
      TOTAL AMOUNT DUE: ₹6,270.00
      `,
    },
    {
      type: "text",
      role: "notes",
      x: 15,
      y: 250,
      w: 180,
      textContent: `
      Notes: Please include the invoice number in your bank transfer reference. Standard 30-day payment terms apply. Thank you for your business.
      `,
    },
    {
      type: "text",
      role: "signature",
      x: 140,
      y: 270,
      w: 90,
      textContent: `
Authorized Signatory:
{{sender_name}}
({{brand_company}})
      `,
    },
  ],
  C4: [
    {
      type: "text",
      role: "invoice_title",
      x: 15,
      y: 20,
      w: 50,
      textContent: `
      INVOICE
      Original Copy
      `,
    },
    {
      type: "text",
      role: "seller_block",
      x: 15,
      y: 50,
      w: 90,
      textContent: `
{{brand_company}}
{{brand_address}}
GSTIN: {{gstin}}
Email: {{brand_email}}
      `,
    },
    {
      type: "text",
      role: "invoice_meta",
      x: 120,
      y: 20,
      w: 90,
      textContent: `
Invoice Number: {{invoice_number}}
Invoice Date: {{date}}
Due Date: {{due_date}}
      `,
    },
    {
      type: "text",
      role: "buyer_block",
      x: 15,
      y: 80,
      w: 100,
      textContent: `
BILL TO:
{{recipient_company}}
Attn: {{recipient_name}}
{{recipient_address}}
      `,
    },
    {
      type: "text",
      role: "items_header",
      x: 15,
      y: 120,
      w: 170,
      textContent: `
      Description | Quantity | Unit Price | Total
      `,
    },
    {
      type: "text",
      role: "item_row",
      x: 15,
      y: 130,
      w: 170,
      textContent: `
      1. UI/UX Redesign - Project Alpha (Dashboard) | 1 | ₹4,500.00 | ₹4,500.00
      2. Custom Widget Component Library (JS/CSS) | 1 | ₹1,200.00 | ₹1,200.00
      `,
    },
    {
      type: "text",
      role: "totals_block",
      x: 120,
      y: 180,
      w: 80,
      textContent: `
      Subtotal: ₹5,700.00
      Tax (10%): ₹570.00
      TOTAL AMOUNT DUE: ₹6,270.00
      `,
    },
    {
      type: "text",
      role: "notes",
      x: 15,
      y: 250,
      w: 180,
      textContent: `
      Notes: Please include the invoice number in your bank transfer reference. Standard 30-day payment terms apply. Thank you for your business.
      `,
    },
    {
      type: "text",
      role: "signature",
      x: 140,
      y: 270,
      w: 90,
      textContent: `
Authorized Signatory:
{{sender_name}}
({{brand_company}})
      `,
    },
  ],
};

const ENVELOPE_LAYOUT_ELEMENTS = {
  // DL Envelope (220 x 110 mm) - Standard for folded A4
  DL_E: [
    {
      type: "text",
      role: "sender",
      x: 15, // Top-left corner
      y: 15,
      w: 80,
      textContent: `
{{sender_name}}
{{sender_address}}
      `,
    },
    {
      type: "text",
      role: "recipient",
      x: 130, // Centered-right
      y: 80, // Vertically centered
      w: 90,
      textContent: `
{{recipient_name}}
{{recipient_title}}, {{recipient_company}}
{{recipient_address}}
      `,
    },
    {
      type: "text",
      role: "postage_stamp", // Placeholder for stamp area
      x: 185,
      y: 25,
      w: 25,
      h: 25,
      textContent: "[STAMP]",
    },
  ],

  // C5 Envelope (229 x 162 mm) - Standard for A5 or folded A4
  C5_E: [
    {
      type: "text",
      role: "sender",
      x: 20,
      y: 20,
      w: 100,
      textContent: `
{{sender_name}}
{{sender_title}}, {{sender_company}}
{{sender_city}}
      `,
    },
    {
      type: "text",
      role: "recipient",
      x: 140,
      y: 80,
      w: 100,
      textContent: `
{{recipient_name}}
{{recipient_title}}, {{recipient_company}}
{{recipient_address}}
      `,
    },
    {
      type: "text",
      role: "postage_stamp", // Placeholder for stamp area
      x: 190,
      y: 25,
      w: 25,
      h: 25,
      textContent: "[STAMP]",
    },
  ],

  // #10 Business Envelope (4.125 x 9.5 in / ~241 x 105 mm)
  Num10_E: [
    {
      type: "text",
      role: "sender",
      x: 20,
      y: 20,
      w: 85,
      textContent: `
{{sender_name}}
{{sender_email}}
      `,
    },
    {
      type: "text",
      role: "recipient",
      x: 170,
      y: 70,
      w: 100,
      textContent: `
{{recipient_name}}
{{recipient_title}}, {{recipient_company}}
{{recipient_address}}
      `,
    },
    {
      type: "text",
      role: "postage_stamp", // Placeholder for stamp area
      x: 200,
      y: 25,
      w: 25,
      h: 25,
      textContent: "[STAMP]",
    },
  ],
};

const setDocumentMetadata = (documentType, pageSize) => {
  let metadata = {
    documentType: documentType,
    pageSize: pageSize,
    units: "mm",
    createdAt: new Date().toISOString(),
    version: "POC-1.0",
  };
  metadata = JSON.stringify(metadata);
  window.sessionStorage.setItem("metadata", metadata);
};

// Check and Set Document Type:

document.querySelectorAll(".documenttype").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const documentType = item.textContent.trim();
    console.log(documentType);

    const toggleBtn = item
      .closest(".dropdown")
      .querySelector(".dropdown-toggle");
    toggleBtn.textContent = `${documentType}`;

    let pageSize = window.sessionStorage.getItem("pageSize");
    console.log(pageSize);

    // Conditional check for documentType and pageSize:

    // if (documentType == "Letter" || documentType == "Invoice") {
    //   if (pageSize != "A4" && pageSize != "A5") {
    //     console.log("Setting pageSize as A4 here.....");
    //     pageSize = "A4";
    //     // console.log(pageType);
    //     showToast(
    //       `Changing PageSize to A4 for documentType: ${documentType}`,
    //       "warning",
    //     );
    //     window.sessionStorage.setItem("pageSize", "A4");
    //     pageTypeDropDownBtn.innerHTML = `Page: <span id="pageType">A4</span>`; // pageType referred from scripts.js module
    //     layoutSvgCanvas(pageSize);
    //     buildRulers(svgRoot, width, height);
    //   }
    // }

    // check for A5 page size as well:

    // Clear all active-page content before loading a preset
    const contentLayer = (typeof getActiveContentLayer === "function")
      ? getActiveContentLayer()
      : document.getElementById("content-layer-1");
    if (contentLayer) contentLayer.innerHTML = "";

    if (documentType == "None") {
      // Use the core clear helper — clearCanvasGrid tries to hide the
      // reset modal which is NOT open here, causing a TypeError crash.
      _doClearCanvas(pageSize);
      showToast("Canvas cleared", "success");
    }

    if (documentType == "Letter") {
      // Letter/Invoice only defined for A4 — switch if needed
      const letterSizes = ["A4", "A5"];
      if (!letterSizes.includes(pageSize)) {
        pageSize = "A4";
        window.sessionStorage.setItem("pageSize", pageSize);
        layoutSvgCanvas(pageSize, false);
        buildRulers(svgRoot, pageDimensions[pageSize].width, pageDimensions[pageSize].height);
        document.getElementById("pageType").textContent = pageSize;
        showToast("Page switched to A4 for Letter", "info");
      }
      setTimeout(() => { addLetterElements(documentType, pageSize); }, 500);
    }

    if (documentType == "Invoice") {
      const invoiceSizes = ["A4", "A5"];
      if (!invoiceSizes.includes(pageSize)) {
        pageSize = "A4";
        window.sessionStorage.setItem("pageSize", pageSize);
        layoutSvgCanvas(pageSize, false);
        buildRulers(svgRoot, pageDimensions[pageSize].width, pageDimensions[pageSize].height);
        document.getElementById("pageType").textContent = pageSize;
        showToast("Page switched to A4 for Invoice", "info");
      }
      setTimeout(() => { addInvoiceElements(documentType, pageSize); }, 500);
    }

    if (documentType == "Envelope") {
      // Envelope layouts only exist for DL_E / C5_E / Num10_E
      const envelopeSizes = ["DL_E", "C5_E", "Num10_E"];
      if (!envelopeSizes.includes(pageSize)) {
        pageSize = "DL_E";
        window.sessionStorage.setItem("pageSize", pageSize);
        layoutSvgCanvas(pageSize, false);
        buildRulers(svgRoot, pageDimensions[pageSize].width, pageDimensions[pageSize].height);
        document.getElementById("pageType").textContent = pageSize;
        showToast("Page switched to DL_E for Envelope", "info");
      }
      setTimeout(() => { addEnvelopeElements(documentType, pageSize); }, 600);
    }

    console.log("running after layout call from letters.js module");
  });
});

const addLetterElements = (documentType, pageSize) => {
  showToast(
    `Adding elements to A4 for documentType: ${documentType}`,
    "success",
  );

  let fontSize = pageDimensions[pageSize].fontSize;

  LETTER_LAYOUT_ELEMENTS[pageSize].forEach((cfg) => {
    addTextBox(
      cfg.role,
      (x = cfg.x),
      (y = cfg.y),
      (w = cfg.w),
      (textContent = cfg.textContent),
      (fontSize = fontSize),
    );
  });

  setDocumentMetadata(documentType, "A4");

  // Only toggle grid for now, think for both or anyone:
  // toggleGrid();
  // toggleSafeZone();
};

const addInvoiceElements = (documentType, pageSize) => {
  showToast(
    `Adding elements to A4 for documentType: ${documentType}`,
    "success",
  );

  let fontSize = pageDimensions[pageSize].fontSize;

  INVOICE_LAYOUT_ELEMENTS[pageSize].forEach((cfg) => {
    addTextBox(
      cfg.role,
      (x = cfg.x),
      (y = cfg.y),
      (w = cfg.w),
      (textContent = cfg.textContent),
      (fontSize = fontSize),
    );
  });

  setDocumentMetadata(documentType, "A4");

  // Only toggle grid for now, think for both or anyone:
  // toggleGrid();
  // toggleSafeZone();
};

const addEnvelopeElements = (documentType, pageSize) => {
  showToast(
    `Adding elements to A4 for documentType: ${documentType}`,
    "success",
  );

  let fontSize = pageDimensions[pageSize].fontSize;

  ENVELOPE_LAYOUT_ELEMENTS[pageSize].forEach((cfg) => {
    addTextBox(
      cfg.role,
      (x = cfg.x),
      (y = cfg.y),
      (w = cfg.w),
      (textContent = cfg.textContent),
      (fontSize = fontSize),
    );
  });

  setDocumentMetadata(documentType, "A4");

  // Only toggle grid for now, think for both or anyone:
  // toggleGrid();
  // toggleSafeZone();
};

// Check and type Delivery Mode:

document.querySelectorAll(".deliverymode").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const deliveryMode = item.textContent.trim();
    console.log(deliveryMode);

    const toggleBtn = item
      .closest(".dropdown")
      .querySelector(".dropdown-toggle");
    toggleBtn.textContent = `${deliveryMode}`;
  });
});

const addDocumentElement = () => {
  let currentCustomElementCount =
    document.getElementById("documentElements").childElementCount;
  let newCustomElementCount = currentCustomElementCount + 1;

  // window.alert(newCustomElementCount);

  const formHTMLBlock = `
    <div
      id="documentElement-${newCustomElementCount}"
      class="card shadow-sm mb-3 no-hover own-template-card"
    >
      <div class="card-body">
          <ul class="nav nav-tabs">
              <li class="nav-item">
                  <a
                      class="nav-link active"
                      data-bs-toggle="tab"
                      href="#textbox-${newCustomElementCount}"
                      >TextBox</a
                  >
              </li>
              <li class="nav-item">
                  <a
                      class="nav-link"
                      data-bs-toggle="tab"
                      href="#imagebox-${newCustomElementCount}"
                      >ImageBox</a
                  >
              </li>
          </ul>
          <div class="tab-content">
              <div
                  class="tab-pane container active"
                  id="textbox-${newCustomElementCount}"
              >
                  <div class="row mt-3 mb-3">
                      <div class="col-md-3">
                          <label
                              class="small text-muted mb-1"
                              ><b>Element No:</b>
                          </label>
                          <input
                              type="text"
                              class="form-control form-control-sm"
                              value="${newCustomElementCount}"
                              disabled
                          />
                      </div>
                      <div class="col-md-3">
                          <label
                              class="small text-muted mb-1"
                              ><b
                                  >Element
                                  Role:</b
                              >
                          </label>
                          <input
                              type="text"
                              class="form-control form-control-sm"
                              id="customRoleName-${newCustomElementCount}"
                              placeholder="e.g. Sender, Recipient"
                          />
                      </div>
                      <div class="col-md-2">
                          <label
                              class="small text-muted mb-1"
                              ><b>X (mm):</b>
                          </label>
                          <input
                              type="number"
                              step="1.0"
                              class="form-control form-control-sm"
                              id="customXCoordinate-${newCustomElementCount}"
                              placeholder="X"
                          />
                      </div>
                      <div class="col-md-2">
                          <label
                              class="small text-muted mb-1"
                              ><b>Y (mm):</b>
                          </label>
                          <input
                              type="number"
                              step="1.0"
                              class="form-control form-control-sm"
                              id="customYCoordinate-${newCustomElementCount}"
                              placeholder="Y"
                          />
                      </div>
                      <div class="col-md-2">
                          <label
                              class="small text-muted mb-1"
                              ><b>Width (mm):</b>
                          </label>
                          <input
                              type="number"
                              step="1.0"
                              class="form-control form-control-sm"
                              id="customWCoordinate-${newCustomElementCount}"
                              placeholder="W"
                          />
                      </div>
                  </div>
                  <div class="row mb-3">
                      <div class="col-12">
                          <label
                              class="small text-muted mb-1x"
                              ><b>Content:</b>
                          </label>
                          <textarea
                              class="form-control form-control-sm"
                              id="customTextContent-${newCustomElementCount}"
                              rows="3"
                              placeholder="Enter Text Content..."
                          ></textarea>
                      </div>
                  </div>
                  <div class="row">
                      <div
                          class="col-12 d-flex justify-content-end gap-2 mt-1"
                      >
                          <button
                              class="btn btn-sm btn-outline-danger"
                              onclick="
                                  removeDocumentElement(
                                      1,
                                  )
                              "
                          >
                              <i
                                  class="fa-solid fa-minus me-1"
                              ></i>
                              Remove
                          </button>
                          <button
                              class="btn btn-sm btn-primary"
                              onclick="
                                  addDocumentElement(
                                      'textBox',
                                  )
                              "
                          >
                              <i
                                  class="fa-solid fa-plus me-1"
                              ></i>
                              Add
                          </button>
                      </div>
                  </div>
              </div>
              <div
                  class="tab-pane container fade"
                  id="imagebox-${newCustomElementCount}"
              >
                  <div class="row mt-3 mb-3">
                      <div class="col-md-3">
                          <label
                              class="small text-muted mb-1"
                              ><b>Element No:</b>
                          </label>
                          <input
                              type="text"
                              class="form-control form-control-sm"
                              value="${newCustomElementCount}"
                              disabled
                          />
                      </div>
                      <div class="col-md-3">
                          <label
                              class="small text-muted mb-1"
                              ><b
                                  >Element
                                  Role:</b
                              >
                          </label>
                          <input
                              type="text"
                              class="form-control form-control-sm"
                              id="customImgRoleName-${newCustomElementCount}"
                              placeholder="e.g. Sender, Recipient"
                          />
                      </div>
                      <div class="col-md-3">
                          <label
                              class="small text-muted mb-1"
                              ><b>Width (mm):</b>
                          </label>
                          <input
                              type="number"
                              step="1.0"
                              class="form-control form-control-sm"
                              id="customImgWidth-${newCustomElementCount}"
                              placeholder="Width"
                          />
                      </div>
                      <div class="col-md-3">
                          <label
                              class="small text-muted mb-1"
                              ><b>Height (mm):</b>
                          </label>
                          <input
                              type="number"
                              step="1.0"
                              class="form-control form-control-sm"
                              id="customImgHeight-1"
                              placeholder="Height"
                          />
                      </div>
                  </div>
                  <div class="row mb-3">
                      <div class="col-12">
                          <label
                              class="small text-muted mb-1x form-label"
                              ><b
                                  >Select
                                  Image:</b
                              >
                          </label>
                          <input
                              class="form-control"
                              type="file"
                              id="customImgInput-${newCustomElementCount}"
                              accept="image/*"
                          />
                      </div>
                  </div>
                  <div class="row">
                      <div
                          class="col-12 d-flex justify-content-end gap-2 mt-1"
                      >
                          <button
                              class="btn btn-sm btn-outline-danger"
                              onclick="
                                  removeDocumentElement(
                                      1,
                                  )
                              "
                          >
                              <i
                                  class="fa-solid fa-minus me-1"
                              ></i>
                              Remove
                          </button>
                          <button
                              class="btn btn-sm btn-primary"
                              onclick="
                                  addDocumentElement(
                                      'imageBox',
                                  )
                              "
                          >
                              <i
                                  class="fa-solid fa-plus me-1"
                              ></i>
                              Add
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  `;

  let currentInnerHTML = document.getElementById("documentElements").innerHTML;

  document.getElementById("documentElements").innerHTML =
    currentInnerHTML + formHTMLBlock;
};

const removeDocumentElement = (idNumber) => {
  const container = document.getElementById("documentElements");
  const elementToRemove = document.getElementById(
    `documentElement-${idNumber}`,
  );

  // 1. Prevent removing the last remaining element if you want at least one
  if (container.childElementCount <= 1) {
    showToast("At least one element is required", "warning");
    return;
  }

  // 2. Remove the specific node directly
  if (elementToRemove) {
    elementToRemove.remove();
  }

  // 3. Re-index remaining elements so IDs stay consistent (1, 2, 3...)
  reIndexElements();
};

const reIndexElements = () => {
  const container = document.getElementById("documentElements");
  const children = container.children;

  Array.from(children).forEach((child, index) => {
    const newIdx = index + 1;

    // Update the main container ID
    child.id = `documentElement-${newIdx}`;

    // Update the visual Label
    const label = child.querySelector(".small.text-muted.mb-1");
    if (label) label.textContent = `Element No: ${newIdx}`;

    // Update Input IDs and Button onclicks
    child.querySelectorAll("input, textarea").forEach((input) => {
      const type = input.id.split("-")[0]; // e.g., customRoleName
      input.id = `${type}-${newIdx}`;
    });

    const removeBtn = child.querySelector(".btn-outline-danger");
    if (removeBtn) {
      removeBtn.setAttribute("onclick", `removeDocumentElement(${newIdx})`);
    }
  });
};

const saveCustomTemplate = async () => {
  const totalElements =
    document.getElementById("documentElements").childElementCount;

  const elements = [];
  const customTemplateName =
    document.getElementById(`customTemplateName`).value;
  const customPageType = document.getElementById(`customPageType`).value;

  let emptyElements = false;

  // Check if Page Type is empty
  if (!customTemplateName.trim()) {
    showToast("Template Name is required!", "warning");
    document.getElementById("customTemplateName").focus();
    return; // Stop the function
  }

  if (!customPageType.trim()) {
    showToast("Page Type is required!", "warning");
    document.getElementById("customPageType").focus();
    return; // Stop the function
  }

  // Check all numeric inputs in the container
  const inputs = document.querySelectorAll("#documentElements input[required]");
  for (let input of inputs) {
    if (!input.value) {
      showToast(`${input.placeholder} is required!`, "warning");
      input.focus();
      return; // Stop the function
    }
  }

  // for (let i = 1; i <= totalElements; i++) {
  //   let customRoleName = document.getElementById(`customRoleName-${i}`).value;
  //   let customXCoordinate =
  //     parseInt(document.getElementById(`customXCoordinate-${i}`).value) + 10; // Check this, whether to add here or not
  //   let customYCoordinate =
  //     parseInt(document.getElementById(`customYCoordinate-${i}`).value) + 10; // Check this, whether to add here or not
  //   let customWCoordinate = parseInt(
  //     document.getElementById(`customWCoordinate-${i}`).value,
  //   ); // Check this, whether to add here or not
  //   let customTextContent = document.getElementById(
  //     `customTextContent-${i}`,
  //   ).value;

  //   let textElement = {
  //     type: "text",
  //     role: customRoleName,
  //     x: customXCoordinate,
  //     y: customYCoordinate,
  //     w: customWCoordinate,
  //     textContent: customTextContent,
  //   };

  //   let customImgRoleName = document.getElementById(
  //     `customImgRoleName-${i}`,
  //   ).value;
  //   let customImgWidth = parseInt(
  //     document.getElementById(`customImgWidth-${i}`).value,
  //   ); // Check this, whether to add here or not
  //   let customImgHeight = parseInt(
  //     document.getElementById(`customImgHeight-${i}`).value,
  //   );

  //   let customImgInput = document.getElementById(`customImgInput-${i}`);
  //   let file = customImgInput.files[0]; // Accesses the file from the input by its ID

  //   // if (!file) {
  //   //   showToast(`Image for element customImgInput-${i} is missing!`, "danger");
  //   //   return;
  //   // }

  //   // Save actual file object natively in Object Store
  //   let imgElement = {
  //     type: "image",
  //     role: customImgRoleName,
  //     imageWidth: customImgWidth,
  //     imageHeight: customImgHeight,
  //     src: file,
  //   };

  //   // Check for Valid Text Element:
  //   if (
  //     customRoleName != "" &&
  //     Number.isNaN(customXCoordinate) == false &&
  //     Number.isNaN(customYCoordinate) == false &&
  //     Number.isNaN(customWCoordinate) == false
  //   ) {
  //     elements.push(textElement);
  //   } else {
  //     emptyElements = true;
  //   }

  //   // Check for Valid Image Element:
  //   if (
  //     customImgRoleName != "" &&
  //     Number.isNaN(customImgWidth) == false &&
  //     Number.isNaN(customImgHeight) == false &&
  //     !file == false
  //   ) {
  //     elements.push(imgElement);
  //   } else {
  //     emptyElements = true;
  //   }
  // }

  // let elements = [];
  // let emptyElements = false;

  // Null-safe getters — dynamically added element blocks only contain
  // TextBox/ImageBox tabs (no table inputs), so any of these may be missing.
  const _val = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : "";
  };
  const _num = (id) => parseFloat(_val(id));

  for (let i = 1; i <= totalElements; i++) {
    let customRoleName = _val(`customRoleName-${i}`).trim();
    let xRaw = _num(`customXCoordinate-${i}`);
    let yRaw = _num(`customYCoordinate-${i}`);
    let wRaw = _num(`customWCoordinate-${i}`);
    let customTextContent = _val(`customTextContent-${i}`);

    // Apply offset +10 (Safely handling NaN)
    let customXCoordinate = xRaw + 10;
    let customYCoordinate = yRaw + 10;
    let customWCoordinate = wRaw;

    // --- IMAGE DATA EXTRACTION ---
    let customImgRoleName = _val(`customImgRoleName-${i}`).trim();
    let customImgWidth = _num(`customImgWidth-${i}`);
    let customImgHeight = _num(`customImgHeight-${i}`);
    let customImgInput = document.getElementById(`customImgInput-${i}`);
    let file = customImgInput ? customImgInput.files[0] : null;

    // --- TABLE DATA EXTRACTION ---
    let customTableRoleName = _val(`customTableRoleName-${i}`).trim();
    let customX = _num(`customX-${i}`);
    let customY = _num(`customY-${i}`);
    let customRows = _num(`customRows-${i}`);
    let customColumns = _num(`customColumns-${i}`);
    let customColumnWidth = _num(`customColumnWidth-${i}`);
    let customRowHeight = _num(`customRowHeight-${i}`);

    // --- VALIDATION LOGIC ---
    const isTextValid =
      customRoleName !== "" &&
      !isNaN(customXCoordinate) &&
      !isNaN(customYCoordinate) &&
      !isNaN(customWCoordinate);

    const isImageValid =
      customImgRoleName !== "" &&
      !isNaN(customImgWidth) &&
      !isNaN(customImgHeight) &&
      !!file;

    const isTableValid =
      customTableRoleName !== "" &&
      !isNaN(customX) &&
      !isNaN(customY) &&
      !isNaN(customRows) &&
      !isNaN(customColumns) &&
      !isNaN(customColumnWidth) &&
      !isNaN(customRowHeight);

    // --- PUSH DATA IF VALID ---
    if (isTextValid) {
      elements.push({
        type: "text",
        role: customRoleName,
        x: customXCoordinate,
        y: customYCoordinate,
        w: customWCoordinate,
        textContent: customTextContent,
      });
    }

    if (isImageValid) {
      // Convert File → base64 data URL so it survives IndexedDB round-trips
      const imageDataUrl = await getImageUrl(file);
      elements.push({
        type: "image",
        role: customImgRoleName,
        imageWidth: customImgWidth,
        imageHeight: customImgHeight,
        src: imageDataUrl,
      });
    }

    if (isTableValid) {
      elements.push({
        type: "table",
        role: customTableRoleName,
        x: customX,
        y: customY,
        rows: customRows,
        cols: customColumns,
        colWidth: customColumnWidth,
        rowHeight: customRowHeight,
      });
    }

    // --- CHECK FOR COMPLETELY EMPTY ROW ---
    // Trigger emptyElements ONLY if neither is valid for this iteration
    if (!isTextValid && !isImageValid && !isTableValid) {
      emptyElements = true;
    }
  }

  // Optional check: ensure the final array isn't empty
  // if (elements.length === 0) {
  //   console.warn("No valid text or image elements were found.");
  // }

  if (emptyElements == true) {
    showToast(
      "Atleast 1 text / image element is needed, cannot create new template...!!!",
      "warning",
    );
    return;
  }

  // Convert the semantic elements into canvas elements, snapshot them as DOM JSON,
  // then remove the temporary canvas additions so the user's canvas isn't polluted.
  // (Elements were NOT added to canvas by this form — the form only built the `elements`
  // array in memory above. We now serialise the active content layer snapshot instead.)

  // --- DOM JSON snapshot of the CURRENT active content layer ---
  const activeLayer = (typeof getActiveContentLayer === "function")
    ? getActiveContentLayer()
    : document.getElementById("content-layer-1");
  const domElements = activeLayer
    ? Array.from(activeLayer.children).map((c) => domToJson(c))
    : [];

  const customTemplate = {
    id:           crypto.randomUUID(),
    name:         customTemplateName,
    pageType:     customPageType,
    format:       "dom-json",
    elements:     domElements,   // unified DOM JSON — loaded via jsonToDom()
    insertedTime: new Date().toISOString(),
    updatedTime:  new Date().toISOString(),
  };

  await saveRecordToDB(customTemplate);

  await saveRecordToDB({
    id:        crypto.randomUUID(),
    entry:     `Template created: ${customTemplateName}`,
    timeStamp: new Date().toISOString(),
  }, "printingAuditLogs");

  showToast("Template saved to gallery!");
};

/**
 * saveCurrentVersion — saves the current multi-page canvas state to printingVersionLogs.
 * Uses the unified multi-page DOM JSON format: [{ pageNo, elements }].
 * NOTE: does NOT save to printingTemplates — use the gallery for that.
 */
const saveCurrentVersion = async () => {
  try {
    const total = (typeof getTotalPages === "function") ? getTotalPages() : 1;
    const pages = [];

    for (let p = 1; p <= total; p++) {
      const cl = document.getElementById(`content-layer-${p}`);
      const elements = cl ? Array.from(cl.children).map((c) => domToJson(c)) : [];
      pages.push({ pageNo: p, elements });
    }

    const hasContent = pages.some((pg) => pg.elements.length > 0);
    if (!hasContent) {
      showToast("Cannot save empty workspace", "warning");
      return;
    }

    const pageSize = window.sessionStorage.getItem("pageSize") || "A4";

    // Save version snapshot
    await saveRecordToDB({
      id:        crypto.randomUUID(),
      entry:     pages,            // multi-page array
      pageSize,
      pageCount: total,
      timeStamp: new Date().toISOString(),
    }, "printingVersionLogs");

    // Audit log
    await saveRecordToDB({
      id:        crypto.randomUUID(),
      entry:     "Version saved",
      timeStamp: new Date().toISOString(),
    }, "printingAuditLogs");

    showToast("Version saved successfully!", "success");
  } catch (error) {
    showToast("Unable to save version", "warning");
  }
};
