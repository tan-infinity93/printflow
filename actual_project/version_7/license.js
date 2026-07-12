/**
 * license.js — §8 Offline Licensing (signed keys, tiers, trial)
 *
 * Key format: base64url(JSON payload) + "." + base64url(ECDSA P-256 signature)
 * Payload: { licensee, tier: "trial"|"standard"|"pro", seats, exp: "YYYY-MM-DD",
 *            features: ["mailMerge","vectorPdf","labels"] }
 *
 * Load order: EARLY — right after shared-db.js (before layout.js).
 * This file NEVER blocks the rest of the app; all enforcement is fail-soft.
 */

/* ============================================================
   PUBLIC KEY (ECDSA P-256 — JWK format)
   Replace this with your own generated public key from tools/generate_license.mjs
   ============================================================ */
const _LICENSE_PUBLIC_KEY_JWK = {
  kty: "EC",
  crv: "P-256",
  // PLACEHOLDER — replace x/y with the real public key coordinates after
  // running:  node tools/generate_license.mjs --gen-keys
  x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  y: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  key_ops: ["verify"],
  ext: true,
};

/* ============================================================
   BASE64URL HELPERS
   ============================================================ */

const _b64UrlDecode = (str) => {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return str;
};

const _b64UrlEncode = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

/* ============================================================
   LICENSE CLASS
   ============================================================ */

const License = (() => {
  const STORAGE_KEY   = "printflow_license";
  const LAST_SEEN_KEY = "printflow_lastSeenDate";

  let _publicKey = null; // CryptoKey, populated on first use

  const _importPublicKey = async () => {
    if (_publicKey) return _publicKey;
    try {
      _publicKey = await crypto.subtle.importKey(
        "jwk",
        _LICENSE_PUBLIC_KEY_JWK,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["verify"],
      );
    } catch (err) {
      console.warn("License: could not import public key", err);
      _publicKey = null;
    }
    return _publicKey;
  };

  const _verifySignature = async (payloadStr, signatureB64) => {
    const key = await _importPublicKey();
    if (!key) return false; // no key → fail-soft (treat as invalid)

    try {
      const payloadBytes = new TextEncoder().encode(payloadStr);
      const sigBytes = Uint8Array.from(
        atob(_b64UrlDecode(signatureB64)),
        (c) => c.charCodeAt(0),
      );
      return await crypto.subtle.verify(
        { name: "ECDSA", hash: { name: "SHA-256" } },
        key,
        sigBytes,
        payloadBytes,
      );
    } catch (err) {
      console.warn("License: signature verification error", err);
      return false;
    }
  };

  const _trialLicense = () => ({
    tier: "trial",
    licensee: "Trial User",
    seats: 1,
    exp: null,
    features: [],
  });

  const current = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return _trialLicense();
    try {
      const payload = JSON.parse(atob(_b64UrlDecode(raw.split(".")[0])));
      // Clock-tamper check
      const today = new Date().toISOString().slice(0, 10);
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY) || "2000-01-01";
      if (today < lastSeen) {
        // Clock went backward — treat as suspicious
        console.warn("License: clock tamper detected, dropping to trial");
        return _trialLicense();
      }
      // Expiry check
      if (payload.exp && today > payload.exp) {
        return _trialLicense();
      }
      return payload;
    } catch (_) {
      return _trialLicense();
    }
  };

  const has = (feature) => {
    const lic = current();
    if (lic.tier === "pro") return true; // pro has everything
    return Array.isArray(lic.features) && lic.features.includes(feature);
  };

  const activate = async (keyString) => {
    keyString = (keyString || "").trim();
    const parts = keyString.split(".");
    if (parts.length !== 2) {
      showToast("Invalid license key format", "danger");
      return false;
    }
    const [payloadB64, sigB64] = parts;
    let payload;
    try {
      payload = JSON.parse(atob(_b64UrlDecode(payloadB64)));
    } catch (_) {
      showToast("Malformed license payload", "danger");
      return false;
    }

    const valid = await _verifySignature(atob(_b64UrlDecode(payloadB64)), sigB64);
    if (!valid) {
      showToast("License signature invalid", "danger");
      return false;
    }

    localStorage.setItem(STORAGE_KEY, keyString);
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString().slice(0, 10));

    showToast(`License activated: ${payload.tier.toUpperCase()} for ${payload.licensee}`, "success");
    _checkExpiry(payload);
    return true;
  };

  const _checkExpiry = (payload) => {
    if (!payload || !payload.exp) return;
    const today = new Date();
    const exp   = new Date(payload.exp);
    const daysLeft = Math.floor((exp - today) / 86400000);
    if (daysLeft < 0) {
      showToast("License has expired — running on trial plan", "warning");
    } else if (daysLeft <= 14) {
      showToast(`License expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`, "warning");
    }
    // Update last-seen date to prevent backward-clock attacks
    localStorage.setItem(LAST_SEEN_KEY, today.toISOString().slice(0, 10));
  };

  // On load: expiry warning
  const _init = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const payload = JSON.parse(atob(_b64UrlDecode(raw.split(".")[0])));
      _checkExpiry(payload);
    } catch (_) {}
  };

  document.addEventListener("DOMContentLoaded", _init);

  return { current, has, activate };
})();

/* ============================================================
   LICENSE UI (settings modal entry)
   ============================================================ */

const openLicenseModal = () => {
  const modalEl = document.getElementById("licenseModal");
  if (!modalEl) { showToast("licenseModal not found", "danger"); return; }

  const lic = License.current();
  const infoEl = document.getElementById("licenseInfo");
  if (infoEl) {
    infoEl.innerHTML = `
      <div class="mb-2">
        <span class="badge rounded-pill ${lic.tier === "trial" ? "bg-secondary" : lic.tier === "pro" ? "bg-success" : "bg-primary"} me-2">${lic.tier.toUpperCase()}</span>
        <strong>${lic.licensee}</strong>
      </div>
      <div class="small text-muted">
        Expires: ${lic.exp || "Never"} &nbsp;|&nbsp;
        Seats: ${lic.seats || 1} &nbsp;|&nbsp;
        Features: ${lic.features && lic.features.length ? lic.features.join(", ") : "Standard"}
      </div>
    `;
  }

  new bootstrap.Modal(modalEl).show();
};

const activateLicenseKey = async () => {
  const keyInput = document.getElementById("licenseKeyInput");
  const key = keyInput?.value.trim();
  if (!key) { showToast("Enter a license key", "warning"); return; }
  const ok = await License.activate(key);
  if (ok) {
    bootstrap.Modal.getInstance(document.getElementById("licenseModal"))?.hide();
    // Refresh license info display
    setTimeout(openLicenseModal, 300);
  }
};
