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
    const usageMB = (usage / (1024 * 1024)).toFixed(4);

    // Restrict Total Space to 1000th part of available device space:
    const quotaMB = (quota / (1024 * 1024) / 1000).toFixed(2);

    const freeMB = (quota / (1024 * 1024) / 1000).toFixed(2);
    const percentUsedMb = ((usage / quota) * 100).toFixed(2);

    console.log(
      `Storage Used: ${usageMB} MB of ${quotaMB} MB (${percentUsedMb}%)`,
    );
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

// Self Execution on Init:

(async () => {
  await checkStorage();
})();

window.setInterval(async () => {
  await checkStorage();
}, 5000);
