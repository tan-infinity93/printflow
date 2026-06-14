//
//

const jsonToDom = (json, parentNamespace = null) => {
  // 1️⃣ Handle text nodes (string values)
  if (typeof json === "string") {
    return document.createTextNode(json);
  }

  // 2️⃣ Validate object
  if (!json || !json.tagName) return null;

  const SVG_NS = "http://www.w3.org/2000/svg";

  // 3️⃣ Detect if SVG element
  const isSvgElement =
    parentNamespace === SVG_NS ||
    json.tagName === "svg" ||
    [
      "g",
      "text",
      "tspan",
      "rect",
      "circle",
      "path",
      "line",
      "polygon",
    ].includes(json.tagName);

  const namespace = isSvgElement ? SVG_NS : null;

  const element = namespace
    ? document.createElementNS(namespace, json.tagName)
    : document.createElement(json.tagName);

  // 4️⃣ Restore attributes
  if (json.attributes) {
    for (const [key, value] of Object.entries(json.attributes)) {
      element.setAttribute(key, value);
    }
  }

  // 5️⃣ Restore children
  if (json.children && Array.isArray(json.children)) {
    for (const child of json.children) {
      const childNode = jsonToDom(child, namespace);
      if (childNode) element.appendChild(childNode);
    }
  }

  return element;
};

const confirmRawImportFile = () => {
  console.log("line 5...");
  const file = document.getElementById("rawImportFileName").files[0];
  if (!file) return;

  const fileName = file.name;
  const fileMode = fileName.split(".")[1]; // refers file extension here

  const reader = new FileReader();

  reader.onload = async function (event) {
    try {
      const content = event.target.result;
      const contentLayer = document.getElementById("content-layer");
      // console.log("File content:", content);
      //
      // Set this file content as svg root
      // const workspace = document.getElementById("workspace");
      onloadInit();

      if (fileMode == "json") {
        let parsedJSON = JSON.parse(content);
        // console.log(parsedJSON);
        console.log("parsedJSON");

        parsedJSON.forEach((obj) => {
          const node = jsonToDom(obj);
          contentLayer.appendChild(node);

          // Re-attach interactions
          if (node.classList.contains("svg-text-group")) {
            enableBoxInteractions(node, "textBox");
          }
        });
      } else {
        console.log("parsedHTML");
        contentLayer.innerHTML = content;
      }

      // Store Audit Log:

      const logRecord = {
        id: crypto.randomUUID(),
        entry: "New File Imported",
        timeStamp: `${new Date().toISOString()}`,
        fileName: fileName,
      };
      const storeName = "printingAuditLogs";
      await saveRecordToDB(logRecord, (STORE_NAME = storeName));

      showToast("File Backup Import is successful...!!!");

      // Update Stats:

      let stats = window.sessionStorage.getItem("stats");
      stats = JSON.parse(stats);

      stats["fileImports"][fileMode] += 1;

      stats = JSON.stringify(stats);
      window.sessionStorage.setItem("stats", stats);
    } catch (error) {
      showToast("File Backup Import is failed...!!!", (type = "error"));
    }
  };
  reader.readAsText(file);
};

//

document.addEventListener("hidden.bs.modal", function () {
  // If there's still an open modal, keep the scrollbar active
  if (document.querySelectorAll(".modal.show").length > 0) {
    document.body.classList.add("modal-open");
  }
});

const importTemplateFile = () => {
  // 1. Remove focus from the button immediately
  if (document.activeElement) {
    document.activeElement.blur();
  }

  // Hide Template Gallery Modal
  bootstrap.Modal.getInstance(
    document.getElementById("templateGalleryModal"),
  ).hide();

  // Show Import Template File Modal
  const modal = new bootstrap.Modal(
    document.getElementById("rawImportTemplateFileModal"),
  );
  modal.show();

  // Show render from Object Store:
};

const closeImportTemplateFileName = () => {
  // 1. Remove focus from the button immediately
  if (document.activeElement) {
    document.activeElement.blur();
  }

  // Hide Import Template File Modal
  bootstrap.Modal.getInstance(
    document.getElementById("rawImportTemplateFileModal"),
  ).hide();

  // Show Template Gallery Modal
  const modal = new bootstrap.Modal(
    document.getElementById("templateGalleryModal"),
  );
  modal.show();

  // Process Uploaded Template File and Add into Object Store:

  const file = document.getElementById("importTemplateFileName").files[0];
  if (!file) return;

  const fileName = file.name;
  const fileMode = fileName.split(".")[1]; // refers file extension here

  const reader = new FileReader();

  reader.onload = async function (event) {
    try {
      const content = JSON.parse(event.target.result);
      console.log("File content:", content);

      // Save into Object Storage here:

      await saveTemplateToDB(content);

      showToast("Template File Import is successful...!!!");
    } catch (error) {
      console.log(error);
      showToast("Template File Import is failed...!!!", (type = "error"));
    }
  };

  reader.onerror = (error) => {
    console.error("FileReader Error:", error);
    showToast("Could not read the file", "danger");
  };

  reader.readAsText(file);
};

const loadSelectedTemplateFile = async (templateId) => {
  // 1. Remove focus from the button immediately
  if (document.activeElement) {
    document.activeElement.blur();
  }

  try {
    let templateData = await getSingleRecordFromDB(templateId);
    // templateData = JSON.stringify(templateData);

    alert(JSON.stringify(templateData));

    // Add element to Page:

    let pageType = templateData["pageType"];
    let elements = templateData[pageType];

    elements.forEach((element) => {
      if (element.type == "text") {
        let role = element.role;
        let x = element.x;
        let y = element.y;
        let w = element.w;
        let textContent = element.textContent;

        addTextBox(
          role,
          (x = x),
          (y = y),
          (w = w),
          (textContent = textContent),
        );
      } else {
        let role = element.role;
        let imageURL = URL.createObjectURL(element.src);
        let imageWidth = element.imageWidth;
        let imageHeight = element.imageHeight;

        addImageBox(imageURL, imageWidth, imageHeight);
      }
    });
    bootstrap.Modal.getInstance(
      document.getElementById("templateGalleryModal"),
    ).hide();

    const logRecord = {
      id: crypto.randomUUID(),
      entry: `New Template Loaded with Id: ${templateId.slice(0, 8)}`,
      timeStamp: `${new Date().toISOString()}`,
    };
    const storeName = "printingAuditLogs";
    await saveRecordToDB(logRecord, (STORE_NAME = storeName));

    showToast("Template Loaded successfully!", "success");
  } catch (error) {
    console.warn(error);
    showToast("Template Loading Error!", "danger");
  }
};
