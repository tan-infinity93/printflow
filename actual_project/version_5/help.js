//

const helpSection = {
  index: [
    "1. Page Setup.",
    "2. Pointer Coordinates.",
    "3. Document Preset.",
    "4. Document Elements.",
    "5. Zoom Controls.",
    "6. Grid Controls.",
    "7. Safe Zone Controls.",
    "8. Printing and Export .",
    "9. App Space Usage.",
    "10. Version History.",
    "11. Audit History.",
    "12. Workflow.",
    // "12. Miscellaneous.",
  ],
  leftHandSide: [
    {
      question: "1. What is Page Setup?",
      answer:
        "Page Setup is area which shows page size selection and also the length and width of the selected page",
    },
    {
      question: "2. What are pointer coordinates?",
      answer:
        "Pointer coordinates are the section where the current cursor position is displayed in real time within the workspace area.",
    },
    {
      question: "3. What is Document Preset?",
      answer:
        "Document Preset is the area where we can select a preset of readymade documents to get started by default. It also includes options to choose and select presets from the inbuilt template gallery, create own custom template and also save versions as well for current work as well",
    },
    {
      question: "4. What is Document Elements?",
      answer:
        "Document Elements include simple building blocks to help build a working copy of your current document.",
    },
    {
      question: "5. What is Zoom Controls?",
      answer:
        "Zoom Controls is the area for managing zoom level of your current workspace.",
    },
    {
      question: "6. What is Grid Controls?",
      answer:
        "Grid Controls is the area to help us adjust the grid boxing of the workspace so that we can make an estimate of our elements placing.",
    },
    {
      question: "7. What is Safe Zone Controls?",
      answer:
        "Safe Zone Controls is the area which is helpful to guide the print elements such as TextBox and ImageBox to not cross the printing zone area to avoid being cutoff from the final imprint copy.",
    },
    {
      question: "8. What is Printing and Export?",
      answer:
        "Printing and Export is the section where you can do a preview of your current workspace before you save a copy, save to pdf file, export a svg copy and also import a svg copy of your current workspace.",
    },
  ],
  rightHandSide: [
    {
      question: "1. What is App Space Usage?",
      answer:
        "App Space Usage is the area which shows your current App Storage and the limits. A generous limit is provided by default which can later be extended on purchasing pro license.",
    },
    {
      question: "2. What is Version History?",
      answer:
        "Version History shows a list of history of changes you've made to your current document. This is only available if saved by the user first and saved automatically on purchasing pro license.",
    },
    {
      question: "3. What is Audit History?",
      answer:
        "Audit History is a ledger which tracks what all changes have been made to the current workspace for the current document.",
    },
  ],
  workflow: [
    {
      question:
        "1. What format does the print document save the current workspace to?",
      answer: "The current workspace is saved to pdf file format.",
    },
    {
      question:
        "2. What are the different formats which are used in the printing app?",
      answer:
        "We use raw data formats such as JSON and also processed data format such as svg. The pdf file format is only used for final output which is ready to be printed",
    },
    {
      question: "3. How do i interact with the system?",
      answer:
        "The workspace contains left and right hand side menus which gives clickable options to add and manipulate document elements. The elements can be dragged and adjusted inside the workspace as well as needed.",
    },
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ],
};

const renderHelpIndexSectionHtml = () => {
  let helpIndexSectionHtml = `
    <table
        class="table table-1 table-borderless"
    >
        <tbody>
  `;

  helpSection["index"].forEach((item) => {
    helpIndexSectionHtml += `
    <tr><td class="align-middle text-start right-hand-menu-font-size-1">${item}</td></tr>
    `;
  });

  helpIndexSectionHtml += `
    </tbody>
    </table>
  `;

  document.getElementById("helpIndexSection").innerHTML = helpIndexSectionHtml;
};

const renderHelpLeftHandSideSectionHtml = () => {
  let helpLeftHandSideSectionHtml = `
    <table
        class="table table-1 table-borderless"
    >
        <tbody>
  `;

  helpSection["leftHandSide"].forEach((item) => {
    helpLeftHandSideSectionHtml += `
      <tr>
        <td class="align-middle text-start right-hand-menu-font-size-1">
        ${item["question"]}
        </td>
        <td class="align-middle text-start right-hand-menu-font-size-1">
        ${item["answer"]}
        </td>
      </tr>
    `;
  });

  helpLeftHandSideSectionHtml += `
    </tbody>
    </table>
  `;

  document.getElementById("helpLeftHandSideSection").innerHTML =
    helpLeftHandSideSectionHtml;
};

const renderHelpRightHandSideSectionHtml = () => {
  let helpRightHandSideSectionHtml = `
    <table
        class="table table-1 table-borderless"
    >
        <tbody>
  `;

  helpSection["rightHandSide"].forEach((item) => {
    helpRightHandSideSectionHtml += `
      <tr>
        <td class="align-middle text-start right-hand-menu-font-size-1">
        ${item["question"]}
        </td>
        <td class="align-middle text-start right-hand-menu-font-size-1">
        ${item["answer"]}
        </td>
      </tr>
    `;
  });

  helpRightHandSideSectionHtml += `
    </tbody>
    </table>
  `;

  document.getElementById("helpRightHandSideSection").innerHTML =
    helpRightHandSideSectionHtml;
};

const renderWorkflowSectionHtml = () => {
  let workflowSectionHtml = `
    <table
        class="table table-1 table-borderless"
    >
        <tbody>
  `;

  helpSection["workflow"].forEach((item) => {
    workflowSectionHtml += `
      <tr>
        <td class="align-middle text-start right-hand-menu-font-size-1">
        ${item["question"]}
        </td>
        <td class="align-middle text-start right-hand-menu-font-size-1">
        ${item["answer"]}
        </td>
      </tr>
    `;
  });

  workflowSectionHtml += `
    </tbody>
    </table>
  `;

  document.getElementById("workflowSection").innerHTML = workflowSectionHtml;
};

const downloadHelpManual = (data) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 15;
  const maxWidth = pageWidth - margin * 2;

  let y = 20;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Help Manual:", margin, y);
  y += 10;

  doc.text("Index:", margin, y);

  y += 10;

  let items = helpSection.index || [];

  items.forEach((item, index) => {
    // Question
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    const indexLines = doc.splitTextToSize(`${item}` || "", maxWidth);
    doc.text(indexLines, margin, y);
    y += indexLines.length * 6;
  });

  y += 10;

  items = helpSection.leftHandSide || [];

  items.forEach((item, index) => {
    // Question
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    const questionLines = doc.splitTextToSize(
      `${item.question}` || "",
      maxWidth,
    );
    doc.text(questionLines, margin, y);
    y += questionLines.length * 6;

    // Answer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const answerLines = doc.splitTextToSize(`> ${item.answer}` || "", maxWidth);
    doc.text(answerLines, margin, y);
    y += answerLines.length * 6 + 8;

    // Add new page if content exceeds page height
    if (y > pageHeight - 20 && index < items.length - 1) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("help_manual.pdf");
};

const downloadAuditLog = async (data) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 15;
  const maxWidth = pageWidth - margin * 2;

  let y = 20;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Audit Logs Export:", margin, y);
  y += 10;

  // const items = helpSection.leftHandSide || [];
  const items = await getAllRecordsFromDB((STORE_NAME = "printingAuditLogs"));

  items.forEach((item, index) => {
    // Question
    doc.setFont("helvetica", "bold");
    // doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const questionLines = doc.splitTextToSize(
      `Entry: ${item.entry}` || "",
      maxWidth,
    );
    doc.text(questionLines, margin, y);
    y += questionLines.length * 6;

    // Answer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const answerLines = doc.splitTextToSize(
      `Timestamp: ${item.timeStamp}` || "",
      maxWidth,
    );
    doc.text(answerLines, margin, y);
    y += answerLines.length * 6 + 8;

    // Add new page if content exceeds page height
    if (y > pageHeight - 20 && index < items.length - 1) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("audit_logs_export.pdf");
};

//

renderHelpIndexSectionHtml();
renderHelpLeftHandSideSectionHtml();
renderHelpRightHandSideSectionHtml();
renderWorkflowSectionHtml();
