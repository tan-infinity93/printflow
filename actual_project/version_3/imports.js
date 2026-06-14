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

  reader.onload = function (event) {
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
