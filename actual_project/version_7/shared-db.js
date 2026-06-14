/**
 * shared-db.js — IndexedDB helper layer shared by index.html and workspace.html.
 *
 * Extracted from scripts.js so the login page no longer loads canvas code
 * (an id collision between the login splash and the SVG canvas previously
 * caused canvas init to run — and crash — on the login page).
 *
 * Load this BEFORE any script that calls the helpers.
 */

const DB_NAME = "PrintingDB";
const DB_VERSION = 2;

const STORE_NAMES = [
  "printingUsers",
  "printingTemplates",
  "printingAuditLogs",
  "printingVersionLogs",
  "printingBrandKit",
  "printingSequences",
];

// Cached DB connection — opened once and reused across all operations.
let _dbPromise = null;

const initDB = () => {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      // v1 stores — created fresh or skipped if already present
      STORE_NAMES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: "id" });
          if (storeName === "printingUsers") {
            store.createIndex("username_password", ["userName", "passWord"], {
              unique: false,
            });
          }
        }
      });
      // v2 additions: printingBrandKit and printingSequences are already
      // handled by the STORE_NAMES loop above (create-if-absent).
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => {
      _dbPromise = null; // allow retry on next call
      reject(e.target.error);
    };
  });
  return _dbPromise;
};

async function saveRecordToDB(templateObj, storeName = "printingTemplates") {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(templateObj);

    request.onsuccess = () => {
      // Notify stats panel that a write occurred — avoids polling via setInterval
      document.dispatchEvent(
        new CustomEvent("printflow:dbwrite", { detail: { store: storeName } }),
      );
      resolve(true);
    };
    request.onerror = () => reject(request.error);
  });
}

async function getAllRecordsFromDB(storeName = "printingTemplates") {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getSingleRecordFromDB(
  templateId,
  storeName = "printingTemplates",
) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(templateId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function checkLoginUser(username, password) {
  const db = await initDB();
  const transaction = db.transaction("printingUsers", "readonly");
  const store = transaction.objectStore("printingUsers");
  const index = store.index("username_password");

  // Query the index with both values as an array
  const request = index.get([username, password]);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result); // Returns the record or undefined
    request.onerror = () => reject(request.error);
  });
}

async function deleteSingleRecordFromDB(
  templateId,
  storeName = "printingTemplates",
) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(templateId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * clearStore — removes ALL records from an object store.
 * Used by importWorkspaceBackup (§9) before re-populating from a backup file.
 */
async function clearStore(storeName) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/* ============================================================
   §11 PWA — Service Worker registration
   Guarded by feature detection so it never throws on non-SW browsers.
   ============================================================ */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        console.log("PrintFlow SW registered:", reg.scope);
      })
      .catch((err) => {
        console.warn("PrintFlow SW registration failed:", err);
      });
  });
}
