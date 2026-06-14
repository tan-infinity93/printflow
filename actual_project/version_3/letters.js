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
      role: "subject",
      x: 15,
      y: 100,
      w: 190,
      textContent: `
      Subject: Proposal for Q1 User Interface Redesign - Project Alpha
      `,
    },
    {
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
      role: "subject",
      x: 15,
      y: 75,
      w: 110,
      textContent: `
      Subject: Proposal for Q1 User Interface Redesign - Project Alpha
      `,
    },
    {
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
      role: "subject",
      x: 15,
      y: 100,
      w: 190,
      textContent: `
      Subject: Proposal for Q1 User Interface Redesign - Project Alpha
      `,
    },
    {
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
      role: "items_header",
      x: 15,
      y: 120,
      w: 170,
      textContent: `
      Description | Quantity | Unit Price | Total
      `,
    },
    {
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
      x: 15,
      y: 250,
      w: 180,
      textContent: `
      Notes: Please include the invoice number in your bank transfer reference. Standard 30-day payment terms apply. Thank you for your business.
      `,
    },
    {
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
      role: "items_header",
      x: 15,
      y: 120,
      w: 170,
      textContent: `
      Description | Quantity | Unit Price | Total
      `,
    },
    {
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
      role: "notes",
      x: 15,
      y: 250,
      w: 180,
      textContent: `
      Notes: Please include the invoice number in your bank transfer reference. Standard 30-day payment terms apply. Thank you for your business.
      `,
    },
    {
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
      role: "items_header",
      x: 15,
      y: 120,
      w: 170,
      textContent: `
      Description | Quantity | Unit Price | Total
      `,
    },
    {
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
      x: 15,
      y: 250,
      w: 180,
      textContent: `
      Notes: Please include the invoice number in your bank transfer reference. Standard 30-day payment terms apply. Thank you for your business.
      `,
    },
    {
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
