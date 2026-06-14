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

    // Convert to MB for readability
    // const usageMB = (usage / (1024 * 1024)).toFixed(4);
    const usageMB = Math.ceil((usage / (1024 * 1024)) * 100) / 100;

    // Restrict Total Space to 1000th part of available device space:
    const quotaMB = (quota / (1024 * 1024) / 1000).toFixed(2);

    const freeMB = (quota / (1024 * 1024) / 1000).toFixed(2);
    // const percentUsedMb = ((usage / quota) * 100).toFixed(2);
    const percentUsedMb = ((usageMB / quotaMB) * 100).toFixed(2);

    // console.log(
    //   `Storage Used: ${usageMB} MB of ${quotaMB} MB (${percentUsedMb}%)`,
    // );
    // appSpaceTotal
    document.getElementById("appSpaceUsed").innerText = `${usageMB} MB`;
    document.getElementById("appSpaceTotal").innerText = `${quotaMB} MB`;
    document.getElementById("appSpaceFree").innerText = `${freeMB} MB`;
    document.getElementById("appSpacePercent").innerText = `${percentUsedMb} %`;
    // document.getElementById("appSpaceUsed").innerText = `${usage} KB`;
    // document.getElementById("appSpaceTotal").innerText = `${quota} KB`;
  } else {
    console.warn("Storage Estimation API is not supported in this browser.");
  }
}

//

const loadAuditHistory = async () => {
  const printingAuditLogs = await getAllRecordsFromDB(
    (STORE_NAME = "printingAuditLogs"),
  );

  // console.log(printingAuditLogs.length);

  let printingAuditLogsHtml = `
    <ul class="list-group list-group-flush">
  `;

  if (printingAuditLogs.length == 0) {
    printingAuditLogs.forEach((log) => {
      printingAuditLogsHtml += `
        <li class="list-group-item padding-1x">
        No Audit Entry Found
        </li>
      `;
    });
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
    (STORE_NAME = "printingVersionLogs"),
  );
  // console.log(printingVersionLogs.length);
  let printingVersionLogsHtml = `
    <ul class="list-group list-group-flush">
  `;

  if (printingVersionLogs.length === 0) {
    printingVersionLogs.forEach((log) => {
      printingVersionLogsHtml += `
        <li class="list-group-item padding-1x">
        No Audit Entry Found
        </li>
      `;
    });
  } else {
    printingVersionLogs.forEach((log, index) => {
      printingVersionLogsHtml += `
        <li class="list-group-item padding-1x right-hand-menu-font-size-1" onclick="window.alert('Loading Version...')">
            ${index + 1} - ${log["id"].slice(0, 8)} .....
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

// Check if all fx can be called below to not cause any lag in Web App:

window.setInterval(async () => {
  await checkStorage();
  await loadAuditHistory();
  await loadVersionHistory();
}, 5000);
