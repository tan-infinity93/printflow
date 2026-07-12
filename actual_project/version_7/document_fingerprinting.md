# Document Fingerprinting

## Overview

Generate a **SHA-256 hash of the export content**, embed it into the document, and log it to the audit DB. Later, re-hash the file and compare to verify authenticity.

---

## Export Types & Strategy

| Export type | Fingerprint embedded in file | Logged to audit DB |
|---|---|---|
| JSON workspace | `_fingerprint` field | ✅ |
| SVG workspace | `<metadata>` tag | ✅ |
| PDF (raster/vector) | PDF keyword metadata | ✅ |

---

## Implementation Pieces

### 1. Shared Fingerprint Utility (`fingerprint.js`)

```js
/**
 * Generates a SHA-256 hex digest of a Blob or ArrayBuffer.
 */
async function generateFingerprint(data) {
  const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Logs a fingerprint record to IndexedDB audit log.
 */
async function logFingerprint({ fileName, exportType, fingerprint, pageCount }) {
  const logRecord = {
    id: crypto.randomUUID(),
    entry: "Document Fingerprint",
    exportType,           // "json" | "svg" | "pdf-raster" | "pdf-vector"
    fileName,
    fingerprint,          // SHA-256 hex
    pageCount: pageCount ?? null,
    timeStamp: new Date().toISOString(),
  };
  await saveRecordToDB(logRecord, "printingAuditLogs");
}
```

---

### 2. JSON/SVG Workspace Export (`exports.js`)

After the blob is created, before download:

```js
const fingerprint = await generateFingerprint(blob);

// Embed fingerprint into JSON payload:
if (fileMode === "json") {
  exportPayload._fingerprint = fingerprint;
  exportPayload._exportedAt = new Date().toISOString();
  blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
}

await logFingerprint({ fileName, exportType: fileMode, fingerprint });
```

> **Note for SVG:** Hash-then-log without embedding, or inject as an SVG `<metadata>` element before hashing. Avoid circular hash injection.

---

### 3. PDF Export (`scripts.js`)

Instead of `pdf.save(fileName)`, get output first:

```js
const pdfOutput = pdf.output("arraybuffer");
const fingerprint = await generateFingerprint(pdfOutput);

// Set PDF metadata (visible in File > Properties in PDF readers):
pdf.setProperties({
  title: fileName,
  subject: `Fingerprint: ${fingerprint}`,
  creator: "PrintFlow",
  keywords: `fingerprint:${fingerprint}`
});

// Now save:
pdf.save(fileName);

await logFingerprint({
  fileName,
  exportType: useVector ? "pdf-vector" : "pdf-raster",
  fingerprint,
  pageCount: total
});
```

---

### 4. Verification Function

```js
async function verifyFileFingerprint(file) {
  const fingerprint = await generateFingerprint(file);

  // For JSON: also check embedded fingerprint
  if (file.type === "application/json") {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const embeddedFP = parsed._fingerprint;
    // Compare embeddedFP against audit log entry for this file
  }

  return fingerprint; // caller compares against audit log
}
```

---

## What This Gives You

- **Tamper detection** — any modification to an exported file changes its hash
- **Audit trail** — every export is logged with its fingerprint and timestamp
- **In-file proof** — the hash is embedded directly in JSON/PDF metadata
- **Re-verification** — re-hash a file at any time and compare against the audit log
