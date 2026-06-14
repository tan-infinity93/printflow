const getSessionStorageSizeInKB = () => {
  let totalChars = 0;
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    // Sum length of keys and values
    totalChars += key.length + value.length;
  }
  // Convert characters to bytes (2 per char) then to MKB
  const sizeInMB = (totalChars * 2) / 1024;
  return sizeInMB.toFixed(2);
};

console.log(`Current sessionStorage size (KB): ${getSessionStorageSizeInKB()}`);

async function checkStorage() {
  if (navigator.storage && navigator.storage.estimate) {
    const { usage, quota } = await navigator.storage.estimate();

    // App allocation = 25% of available IndexedDB / object-storage quota
    const APP_QUOTA_FRACTION = 0.25;
    const usageMB   = Math.ceil((usage / (1024 * 1024)) * 100) / 100;
    const quotaMB   = parseFloat((quota / (1024 * 1024) * APP_QUOTA_FRACTION).toFixed(2));
    const freeMB    = parseFloat(Math.max(0, quotaMB - usageMB).toFixed(2));
    const percentUsedMb = ((usageMB / quotaMB) * 100).toFixed(1);

    document.getElementById("appSpaceUsed").innerText    = `${usageMB} MB`;
    document.getElementById("appSpaceTotal").innerText   = `${quotaMB} MB`;
    document.getElementById("appSpaceFree").innerText    = `${freeMB} MB`;
    document.getElementById("appSpacePercent").innerText = `${percentUsedMb} %`;
  } else {
    console.warn("Storage Estimation API is not supported in this browser.");
    ["appSpaceUsed","appSpaceTotal","appSpaceFree","appSpacePercent"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerText = "N/A";
    });
  }
}

//

const loadAuditHistory = async () => {
  const printingAuditLogs = await getAllRecordsFromDB(
    "printingAuditLogs",
  );

  // console.log(printingAuditLogs.length);

  let printingAuditLogsHtml = `
    <ul class="list-group list-group-flush">
  `;

  if (printingAuditLogs.length == 0) {
    printingAuditLogsHtml += `
      <li class="list-group-item padding-1x">
      No Audit Entry Found
      </li>
    `;
  } else {
    printingAuditLogs.forEach((log, index) => {
      printingAuditLogsHtml += `
        <li class="list-group-item padding-1x right-hand-menu-font-size-1">
            ${index + 1} - ${log["entry"]}
        </li>
      `;
    });
  }

  printingAuditLogsHtml += `</ul>`;
  document.getElementById("auditHistoryDiv").innerHTML = printingAuditLogsHtml;
};

const loadVersionHistory = async () => {
  //
  const printingVersionLogs = await getAllRecordsFromDB(
    "printingVersionLogs",
  );
  // console.log(printingVersionLogs.length);
  let printingVersionLogsHtml = `
    <ul class="list-group list-group-flush">
  `;

  if (printingVersionLogs.length === 0) {
    printingVersionLogsHtml += `
      <li class="list-group-item padding-1x">
      No Version Found
      </li>
    `;
  } else {
    printingVersionLogs.forEach((log, index) => {
      const humanDate = log["timeStamp"]
        ? new Date(log["timeStamp"]).toLocaleString()
        : log["id"].slice(0, 8);
      printingVersionLogsHtml += `
        <li class="list-group-item padding-1x right-hand-menu-font-size-1"
            style="cursor:pointer"
            onclick="restoreVersion('${log.id}')"
            title="Click to restore this version">
            ${index + 1} - ${humanDate}
        </li>
      `;
    });
  }

  printingVersionLogsHtml += `</ul>`;
  document.getElementById("versionHistoryDiv").innerHTML =
    printingVersionLogsHtml;
};

// Self Execution on Init:

(async () => {
  await checkStorage();
  await loadAuditHistory();
  await loadVersionHistory();
})();

// Event-driven refresh — updates the stats panel only when a DB write actually occurs.
// Replaces the old 5-second setInterval polling.
document.addEventListener("printflow:dbwrite", async () => {
  await checkStorage();
  await loadAuditHistory();
  await loadVersionHistory();
});
