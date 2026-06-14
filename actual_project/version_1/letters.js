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

const LETTER_LAYOUT_ELEMENTS = [
  {
    role: "sender",
    x: 10,
    y: 10,
    w: 190,
    textContent: `
    Tanmoy Karmokar
    Lead Designer, PixelStream Studios
    123 Creative Suite, Mumbai, MH 400012
    tkarmokar32@gmail.com
    ${getCurrentDate()}
    `,
  },
  {
    role: "recipient",
    x: 10,
    y: 60,
    w: 190,
    textContent: `
    Chinmay Karmokar
    Project Director, Global Tech Solutions
    456 Innovation Way, San Francisco, CA 94105
    `,
  },
  {
    role: "subject",
    x: 10,
    y: 100,
    w: 190,
    textContent: `
    Subject: Proposal for Q1 User Interface Redesign - Project Alpha
    `,
  },
  {
    role: "body",
    x: 10,
    y: 130,
    w: 190,
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
    role: "footer",
    x: 10,
    y: 250,
    w: 190,
    textContent: `
    Sincerely,
    Tanmoy Karmokar
    Lead Designer
    `,
  },
];

const INVOICE_LAYOUT_ELEMENTS = [
  {
    role: "invoice_title",
    x: 10,
    y: 10,
    w: 50,
    textContent: `
    INVOICE
    Original Copy
    `,
  },
  {
    role: "seller_block",
    x: 10,
    y: 40,
    w: 90,
    textContent: `
    PixelStream Studios
    123 Creative Suite, Mumbai, MH 400012
    GSTIN: 27AAAAA0000A1Z5
    Email: tkarmokar32@pixelstream.in
    `,
  },
  {
    role: "invoice_meta",
    x: 110,
    y: 10,
    w: 90,
    textContent: `
    Invoice Number: INV-2026-001
    Invoice Date: January 18, 2026
    Due Date: February 17, 2026
    `,
  },
  {
    role: "buyer_block",
    x: 10,
    y: 90,
    w: 100,
    textContent: `
    BILL TO:
    Global Tech Solutions
    Attn: Jordan Smith
    456 Innovation Way, San Francisco, CA 94105
    `,
  },
  {
    role: "items_header",
    x: 10,
    y: 130,
    w: 170,
    textContent: `
    Description | Quantity | Unit Price | Total
    `,
  },
  {
    role: "item_row",
    x: 10,
    y: 155,
    w: 170,
    textContent: `
    1. UI/UX Redesign - Project Alpha (Dashboard) | 1 | ₹4,500.00 | ₹4,500.00
    2. Custom Widget Component Library (JS/CSS) | 1 | ₹1,200.00 | ₹1,200.00
    `,
  },
  {
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
    role: "notes",
    x: 10,
    y: 225,
    w: 190,
    textContent: `
    Notes: Please include the invoice number in your bank transfer reference. Standard 30-day payment terms apply. Thank you for your business.
    `,
  },
  {
    role: "signature",
    x: 110,
    y: 255,
    w: 90,
    textContent: `
    Authorized Signatory: Tanmoy Karmokar
    (PixelStream Studios)
    `,
  },
];

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
    toggleBtn.textContent = `Type: ${documentType}`;

    const pageSize = window.sessionStorage.getItem("pageSize");
    console.log(pageSize);

    // Conditional check for documentType and pageSize:

    if (documentType == "Letter" || documentType == "Invoice") {
      if (pageSize != "A4" && pageSize != "A5") {
        console.log("Setting pageSize as A4 here.....");
        pageSize = "A4";
        // console.log(pageType);
        showToast(
          `Changing PageSize to A4 for documentType: ${documentType}`,
          "warning",
        );
        window.sessionStorage.setItem("pageSize", "A4");
        pageTypeDropDownBtn.innerHTML = `Page: <span id="pageType">A4</span>`; // pageType referred from scripts.js module
        layoutCanvas(pageSize);
      }
    }

    // check for A5 page size as well:

    if (documentType == "None") {
      // Only toggle grid for now, think for both or anyone:
      // toggleGrid();
      // toggleSafeZone();
      clearCanvasGrid();
      // toggleGrid();
      // toggleSafeZone();
    }

    if (documentType == "Letter") {
      // console.log("at line 128 inside letter.js module");
      setTimeout(() => {
        addLetterElements(documentType);
      }, 1000);
    }

    if (documentType == "Invoice") {
      // console.log("at line 128 inside letter.js module");
      setTimeout(() => {
        addInvoiceElements(documentType);
      }, 1000);
    }

    console.log("running after layout call from letters.js module");
  });
});

const addLetterElements = (documentType) => {
  showToast(
    `Adding elements to A4 for documentType: ${documentType}`,
    "success",
  );
  LETTER_LAYOUT_ELEMENTS.forEach((cfg) => {
    addTextBox(
      cfg.role,
      (x = cfg.x),
      (y = cfg.y),
      (w = cfg.w),
      (textContent = cfg.textContent),
    );
  });

  setDocumentMetadata(documentType, "A4");

  // Only toggle grid for now, think for both or anyone:
  // toggleGrid();
  // toggleSafeZone();
};

const addInvoiceElements = (documentType) => {
  showToast(
    `Adding elements to A4 for documentType: ${documentType}`,
    "success",
  );

  INVOICE_LAYOUT_ELEMENTS.forEach((cfg) => {
    addTextBox(
      cfg.role,
      (x = cfg.x),
      (y = cfg.y),
      (w = cfg.w),
      (textContent = cfg.textContent),
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
    toggleBtn.textContent = `Type: ${deliveryMode}`;
  });
});
