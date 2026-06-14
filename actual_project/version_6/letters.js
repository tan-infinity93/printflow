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
      textContent: `
      Tanmoy Karmokar
      Lead Designer, PixelStream Studios
      123 Creative Suite, Mumbai, MH 400012
      tkarmokar32@gmail.com
      ${getCurrentDate()}
      `,
    },
    {
      type: "text",
      role: "recipient",
      x: 15,
      y: 60,
      w: 90,
      textContent: `
      Chinmay Karmokar
      Project Director, Global Tech Solutions
      456 Innovation Way, San Francisco, CA 94105
      `,
    },
    {
      type: "text",
      role: "subject",
      x: 15,
      y: 100,
      w: 190,
      textContent: `
      Subject: Proposal for Q1 User Interface Redesign - Project Alpha
      `,
    },
    {
      type: "text",
      role: "body",
      x: 15,
      y: 125,
      w: 180,
      textContent: `
      Dear Chinmay Karmokar,
           I hope this letter finds you well. I am writing to formally submit our proposal for the upcoming UI/UX overhaul of the Project Alpha dashboard. Based on our preliminary meeting last Tuesday, my team has developed a design strategy that prioritizes the Material 3 (Android style) aesthetic we discussed.

      Key highlights of this proposal include:
      1. Implementation of rounded-pill interaction elements for improved touch-targets.
      2. A responsive grid system that optimizes screen real estate across mobile and desktop.
      3. Integration of high-contrast typography to ensure accessibility standards are met.

      We have estimated a development timeline of six weeks, beginning February 1, 2026. I have attached the full technical breakdown, including the proposed JSON structure for our new component library, for your review.
      I look forward to discussing how we can move forward with this collaboration. Please let me know if you would like to schedule a follow-up call later this week.
      `,
    },
    {
      type: "text",
      role: "footer",
      x: 15,
      y: 250,
      w: 90,
      textContent: `
      Sincerely,
      Tanmoy Karmokar
      Lead Designer
      `,
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
      Tanmoy Karmokar
      Lead Designer, PixelStream Studios
      123 Creative Suite, Mumbai, MH 400012
      tkarmokar32@gmail.com
      ${getCurrentDate()}
      `,
    },
    {
      type: "text",
      role: "recipient",
      x: 15,
      y: 55,
      w: 90,
      textContent: `
      Chinmay Karmokar
      Project Director, Global Tech Solutions
      456 Innovation Way, San Francisco, CA 94105
      `,
    },
    {
      type: "text",
      role: "subject",
      x: 15,
      y: 75,
      w: 110,
      textContent: `
      Subject: Proposal for Q1 User Interface Redesign - Project Alpha
      `,
    },
    {
      type: "text",
      role: "body",
      x: 15,
      y: 85,
      w: 110,
      textContent: `
      Dear Chinmay Karmokar,

           I hope this letter finds you well. I am writing to formally submit our proposal for the upcoming UI/UX overhaul of the Project Alpha dashboard. Based on our preliminary meeting last Tuesday, my team has developed a design strategy that prioritizes the Material 3 (Android style) aesthetic we discussed.

      Key highlights of this proposal include:
      1. Implementation of rounded-pill interaction elements for improved touch-targets.
      2. A responsive grid system that optimizes screen real estate across mobile and desktop.
      3. Integration of high-contrast typography to ensure accessibility standards are met.

      We have estimated a development timeline of six weeks, beginning February 1, 2026. I have attached the full technical breakdown, including the proposed JSON structure for our new component library, for your review.
      I look forward to discussing how we can move forward with this collaboration. Please let me know if you would like to schedule a follow-up call later this week.
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
      Tanmoy Karmokar
      Lead Designer
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
      Tanmoy Karmokar
      Lead Designer, PixelStream Studios
      123 Creative Suite, Mumbai, MH 400012
      tkarmokar32@gmail.com
      ${getCurrentDate()}
      `,
    },
    {
      type: "text",
      role: "recipient",
      x: 15,
      y: 60,
      w: 90,
      textContent: `
      Chinmay Karmokar
      Project Director, Global Tech Solutions
      456 Innovation Way, San Francisco, CA 94105
      `,
    },
    {
      type: "text",
      role: "subject",
      x: 15,
      y: 100,
      w: 190,
      textContent: `
      Subject: Proposal for Q1 User Interface Redesign - Project Alpha
      `,
    },
    {
      type: "text",
      role: "body",
      x: 15,
      y: 125,
      w: 180,
      textContent: `
      Dear Chinmay Karmokar,

           I hope this letter finds you well. I am writing to formally submit our proposal for the upcoming UI/UX overhaul of the Project Alpha dashboard. Based on our preliminary meeting last Tuesday, my team has developed a design strategy that prioritizes the Material 3 (Android style) aesthetic we discussed.

      Key highlights of this proposal include:
      1. Implementation of rounded-pill interaction elements for improved touch-targets.
      2. A responsive grid system that optimizes screen real estate across mobile and desktop.
      3. Integration of high-contrast typography to ensure accessibility standards are met.

      We have estimated a development timeline of six weeks, beginning February 1, 2026. I have attached the full technical breakdown, including the proposed JSON structure for our new component library, for your review.
      I look forward to discussing how we can move forward with this collaboration. Please let me know if you would like to schedule a follow-up call later this week.
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
      Tanmoy Karmokar
      Lead Designer
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
      PixelStream Studios
      123 Creative Suite, Mumbai, MH 400012
      GSTIN: 27AAAAA0000A1Z5
      Email: tkarmokar32@pixelstream.in
      `,
    },
    {
      type: "text",
      role: "invoice_meta",
      x: 120,
      y: 20,
      w: 90,
      textContent: `
      Invoice Number: INV-2026-001
      Invoice Date: January 18, 2026
      Due Date: February 17, 2026
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
      Global Tech Solutions
      Attn: Jordan Smith
      456 Innovation Way, San Francisco, CA 94105
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
      Tanmoy Karmokar
      (PixelStream Studios)
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
      PixelStream Studios
      123 Creative Suite, Mumbai, MH 400012
      GSTIN: 27AAAAA0000A1Z5
      Email: tkarmokar32@pixelstream.in
      `,
    },
    {
      type: "text",
      role: "invoice_meta",
      x: 85,
      y: 20,
      w: 90,
      textContent: `
      Invoice Number: INV-2026-001
      Invoice Date: January 18, 2026
      Due Date: February 17, 2026
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
      Global Tech Solutions
      Attn: Jordan Smith
      456 Innovation Way, San Francisco, CA 94105
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
      Tanmoy Karmokar
      (PixelStream Studios)
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
      PixelStream Studios
      123 Creative Suite, Mumbai, MH 400012
      GSTIN: 27AAAAA0000A1Z5
      Email: tkarmokar32@pixelstream.in
      `,
    },
    {
      type: "text",
      role: "invoice_meta",
      x: 120,
      y: 20,
      w: 90,
      textContent: `
      Invoice Number: INV-2026-001
      Invoice Date: January 18, 2026
      Due Date: February 17, 2026
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
      Global Tech Solutions
      Attn: Jordan Smith
      456 Innovation Way, San Francisco, CA 94105
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
      Tanmoy Karmokar
      (PixelStream Studios)
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
      Tanmoy Karmokar
      123 Creative Suite, Mumbai, MH 400012
      `,
    },
    {
      type: "text",
      role: "recipient",
      x: 130, // Centered-right
      y: 80, // Vertically centered
      w: 90,
      textContent: `
      Chinmay Karmokar
      Project Director, Global Tech Solutions
      456 Innovation Way, San Francisco, CA 94105
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
      Tanmoy Karmokar
      Lead Designer, PixelStream Studios
      Mumbai, MH 400012
      `,
    },
    {
      type: "text",
      role: "recipient",
      x: 140,
      y: 80,
      w: 100,
      textContent: `
      Chinmay Karmokar
      Project Director, Global Tech Solutions
      456 Innovation Way, San Francisco, CA 94105
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
      Tanmoy Karmokar
      tkarmokar32@gmail.com
      `,
    },
    {
      type: "text",
      role: "recipient",
      x: 170,
      y: 70,
      w: 100,
      textContent: `
      Chinmay Karmokar
      Global Tech Solutions
      San Francisco, CA 94105
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

    if (documentType == "None") {
      // Only toggle grid for now, think for both or anyone:
      clearCanvasGrid();
    }

    if (documentType == "Letter") {
      // clearCanvasGrid();
      // console.log("at line 128 inside letter.js module");
      setTimeout(() => {
        addLetterElements(documentType, pageSize);
      }, 1000);
    }

    if (documentType == "Invoice") {
      // clearCanvasGrid();
      // console.log("at line 128 inside letter.js module");
      setTimeout(() => {
        addInvoiceElements(documentType, pageSize);
      }, 1000);
    }

    if (documentType == "Envelope") {
      // clearCanvasGrid();
      // console.log("at line 128 inside letter.js module");
      setTimeout(() => {
        addEnvelopeElements(documentType, pageSize);
      }, 1000);
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

  for (let i = 1; i <= totalElements; i++) {
    let customRoleName = document
      .getElementById(`customRoleName-${i}`)
      .value.trim();
    let xRaw = parseInt(
      document.getElementById(`customXCoordinate-${i}`).value,
    );
    let yRaw = parseInt(
      document.getElementById(`customYCoordinate-${i}`).value,
    );
    let wRaw = parseInt(
      document.getElementById(`customWCoordinate-${i}`).value,
    );
    let customTextContent = document.getElementById(
      `customTextContent-${i}`,
    ).value;

    // Apply offset +10 (Safely handling NaN)
    let customXCoordinate = xRaw + 10;
    let customYCoordinate = yRaw + 10;
    let customWCoordinate = wRaw;

    // --- IMAGE DATA EXTRACTION ---
    let customImgRoleName = document
      .getElementById(`customImgRoleName-${i}`)
      .value.trim();
    let customImgWidth = parseInt(
      document.getElementById(`customImgWidth-${i}`).value,
    );
    let customImgHeight = parseInt(
      document.getElementById(`customImgHeight-${i}`).value,
    );
    let customImgInput = document.getElementById(`customImgInput-${i}`);
    let file = customImgInput ? customImgInput.files[0] : null;

    // --- TABLE DATA EXTRACTION ---
    let customTableRoleName = document.getElementById(
      `customTableRoleName-${i}`,
    ).value;
    let customX = document.getElementById(`customX-${i}`).value;
    let customY = document.getElementById(`customY-${i}`).value;
    let customRows = document.getElementById(`customRows-${i}`).value;
    let customColumns = document.getElementById(`customColumns-${i}`).value;
    let customColumnWidth = document.getElementById(
      `customColumnWidth-${i}`,
    ).value;
    let customRowHeight = document.getElementById(`customRowHeight-${i}`).value;

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
      elements.push({
        type: "image",
        role: customImgRoleName,
        imageWidth: customImgWidth,
        imageHeight: customImgHeight,
        src: file,
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
      (type = "warning"),
    );
    return;
  }

  const customTemplate = {
    id: crypto.randomUUID(),
    pageType: customPageType,
    [customPageType]: elements,
    name: customTemplateName,
    insertedTime: new Date().toISOString(),
    updatedTime: new Date().toISOString(),
  };
  // Replicate id, name, insertedTime & updatedTime in my JSON object as well:
  console.log(customTemplate);
  await saveRecordToDB(customTemplate);

  const logRecord = {
    id: crypto.randomUUID(),
    entry: "New Template Created",
    timeStamp: `${new Date().toISOString()}`,
  };
  const storeName = "printingAuditLogs";
  await saveRecordToDB(logRecord, (STORE_NAME = storeName));

  showToast("Template File saved to Gallery...!!!");
};

const saveCurrentVersion = async () => {
  // Get Elements and save them as JSON in Objectstore :
  console.log("here line 1205....");

  try {
    const contentLayer = document.getElementById("content-layer");
    let exportData = Array.from(contentLayer.children).map((child) =>
      domToJson(child),
    );

    if (exportData.length == 0) {
      showToast("Cannot Save Empty Workspace...!!!", (type = "warning"));
      return;
    }

    // console.log(exportData);
    // return;
    const customPageType = window.sessionStorage.getItem("pageSize") || "A4";
    const templateId = crypto.randomUUID();

    console.log(exportData);

    let logRecord, storeName;

    logRecord = {
      id: templateId,
      pageType: customPageType,
      [customPageType]: exportData,
      name: templateId.slice(0, 8),
      insertedTime: new Date().toISOString(),
      updatedTime: new Date().toISOString(),
    };
    storeName = "printingTemplates";
    await saveRecordToDB(logRecord, (STORE_NAME = storeName));

    logRecord = {
      id: crypto.randomUUID(),
      entry: "New Template Created",
      timeStamp: `${new Date().toISOString()}`,
    };
    storeName = "printingAuditLogs";
    await saveRecordToDB(logRecord, (STORE_NAME = storeName));

    logRecord = {
      id: crypto.randomUUID(),
      entry: exportData,
      timeStamp: `${new Date().toISOString()}`,
    };
    storeName = "printingVersionLogs";
    await saveRecordToDB(logRecord, (STORE_NAME = storeName));

    showToast("Saved Current Version successfully...!!!");
  } catch (error) {
    showToast("Unable to Save Current Version...!!!", (type = "warning"));
  }
};
