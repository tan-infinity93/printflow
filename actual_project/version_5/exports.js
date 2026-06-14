/* */

const saveExportMode = () => {
  let fileMode = window.sessionStorage.getItem("fileMode") || "html";

  if (fileMode == "html") {
    fileMode = "json";
  } else {
    fileMode = "html";
  }

  window.sessionStorage.setItem("fileMode", fileMode);
};

const domToJson = (node) => {
  // Handle text nodes: return string content if it's not just whitespace
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue.trim() ? node.nodeValue : null;
  }

  // Handle non-element nodes (comments, etc.)
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const obj = {
    tagName: node.tagName.toLowerCase(),
    attributes: {},
    children: [],
  };

  // 1. Capture all attributes safely
  if (node.attributes) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      obj.attributes[attr.name] = attr.value;
    }
  }

  // 2. Fix: Use Array.from to ensure childNodes is iterable
  const children = Array.from(node.childNodes);
  for (const child of children) {
    const childJson = domToJson(child);
    if (childJson !== null) {
      obj.children.push(childJson);
    }
  }

  return obj;
};

const confirmRawExportFile = async () => {
  console.log("here line 11...");

  const workspace = document.getElementById("workspace");
  const innerHTML = workspace.outerHTML;
  const contentLayer = document.getElementById("content-layer");
  const fileName = document.getElementById("rawExportFileName").value;
  const fileMode = window.sessionStorage.getItem("fileMode");
  let blob;

  if (fileName == "") {
    showToast("File Name cannot be empty", "warnning");
  }

  if (fileMode == "html") {
    // blob = new Blob([innerHTML], { type: "text/html" });
    // blob = new Blob([innerHTML], { type: "image/svg+xml" });
    blob = new Blob([contentLayer.innerHTML], { type: "image/svg+xml" });
  } else {
    // alert("fileMode is JSON...!!!", "sucess");

    // let innerHTMLJSON = domToJson(workspace);
    // innerHTMLJSON = JSON.stringify(innerHTMLJSON, null, 2);
    let exportData = Array.from(contentLayer.children).map((child) =>
      domToJson(child),
    );
    let innerHTMLJSON = JSON.stringify(exportData, null, 2);
    blob = new Blob([innerHTMLJSON], { type: "application/json" });
  }

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Update Stats:

  let stats = window.sessionStorage.getItem("stats");
  stats = JSON.parse(stats);

  stats["fileExports"][fileMode] += 1;

  stats = JSON.stringify(stats);
  window.sessionStorage.setItem("stats", stats);

  // Save Version Info:

  // const currentTimestamp = new Date().toISOString();
  // let versionHistory = window.sessionStorage.getItem("versionHistory");
  // versionHistory = JSON.parse(versionHistory);

  // let version = {
  //   fileName: currentTimestamp,
  // };

  // versionHistory.push(version);
  // versionHistory = JSON.stringify(versionHistory);
  // window.sessionStorage.setItem("versionHistory", versionHistory);
  // showVersionHistory();

  const logRecord = {
    id: crypto.randomUUID(),
    entry: "New Export created",
    timeStamp: `${new Date().toISOString()}`,
    fileName: fileName,
  };
  const storeName = "printingAuditLogs";
  await saveRecordToDB(logRecord, (STORE_NAME = storeName));
};

// exportCurrentWorkSpace();

const saveAppSettings = () => {
  console.log("here line 10...");

  const appSettings = {
    leftHandMenu: {},
  };

  // Save Display Sections:

  let menuNames = [
    "page-setup-and-coordinates",
    "pointer-coordinates",
    "document-preset",
    "document-elements",
    "zoom-controls",
    "grid-controls",
  ];
  menuNames.forEach((menuName) => {
    let menuDiv = document.getElementById(menuName);
    let classList = menuDiv.classList;

    // appSettings["leftHandMenu"] = {};

    if (classList.contains("hidden") == true) {
      menuDiv.classList.remove("hidden");
      // window.sessionStorage.setItem(`${menuName}-display`, "1");

      appSettings["leftHandMenu"][`${menuName}-display`] = "1";
    } else {
      menuDiv.classList.add("hidden");
      // window.sessionStorage.setItem(`${menuName}-display`, "0");

      appSettings["leftHandMenu"][`${menuName}-display`] = "0";
    }
  });

  console.log(appSettings);
};

// saveAppSettings();

const resetAppSettings = async () => {
  window.sessionStorage.clear();

  const logRecord = {
    id: crypto.randomUUID(),
    entry: "App Storage Cleared",
    timeStamp: `${new Date().toISOString()}`,
  };
  const storeName = "printingAuditLogs";
  await saveRecordToDB(logRecord, (STORE_NAME = storeName));

  showToast("App Settings cleared successfully, will reload page", "success");

  // check logic below:
  // let checkbox = document.getElementById("resetAppSettingsCheckbox");
  // checkbox.checked = false;

  // if (checkbox.checked == true) {
  //   checkbox.checked = false;
  // }
  // document.getElementById("resetAppSettingsCheckbox").checked = false;

  // Reload App to set initial variables in sessionStorage for now:
  setTimeout(() => {
    window.location.reload();
  }, 3000);
};

const showVersionHistory = () => {
  //versionHistory//versionHistoryList
  console.log("here line 184....");

  let versionHistoryDiv = document.getElementById("versionHistory");
  let versionHistoryList = document.getElementById("versionHistoryList");
  let versionHistory = window.sessionStorage.getItem("versionHistory");
  let versionHistoryListHTML = ``;
  let index = 1;

  versionHistory = JSON.parse(versionHistory);

  // console.log(versionHistory);

  for (const version of versionHistory) {
    for (const [key, value] of Object.entries(version)) {
      let humanReadableDate = new Date(value).toLocaleString();
      versionHistoryListHTML += `
        <li>
            <a
                class="dropdown-item right-hand-menu-font-size2-1"
                href="#"
                id="${key}-${humanReadableDate}"
                >${index}. ${key}-${humanReadableDate}</a
            >
        </li>
      `;
      versionHistoryDiv.innerText = `${index}. ${key}`;
    }
    index += 1;
  }

  versionHistoryList.innerHTML = versionHistoryListHTML;

  // versionHistoryDiv.innerText = "";
};

// Self call to show on UI load from same module instead of scripts.js module
// showVersionHistory();
