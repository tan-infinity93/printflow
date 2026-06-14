/**
 * tools/generate_license.mjs — Key generation and license signing utility.
 * NOT loaded by the app. Run with Node.js 18+.
 *
 * Usage:
 *   node tools/generate_license.mjs --gen-keys
 *     Generates a new P-256 key pair and prints the public key JWK to paste
 *     into license.js and the private key JWK to store securely offline.
 *
 *   node tools/generate_license.mjs --issue \
 *     --licensee "Acme Corp" --tier pro --seats 5 \
 *     --exp 2027-12-31 \
 *     --features mailMerge,vectorPdf,labels \
 *     --key path/to/private-key.json
 *
 * Output: a license key string (base64url.base64url) ready to paste into the app.
 */

import { subtle } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { argv } from "node:process";

const args = argv.slice(2);
const get = (flag, def = null) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : def;
};

const b64url = (buf) =>
  Buffer.from(buf).toString("base64url");

if (args.includes("--gen-keys")) {
  const keyPair = await subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const pubJwk  = await subtle.exportKey("jwk", keyPair.publicKey);
  const privJwk = await subtle.exportKey("jwk", keyPair.privateKey);

  console.log("\n=== PUBLIC KEY (paste into license.js _LICENSE_PUBLIC_KEY_JWK) ===");
  console.log(JSON.stringify(pubJwk, null, 2));

  const privPath = "tools/private-key.json";
  writeFileSync(privPath, JSON.stringify(privJwk, null, 2));
  console.log(`\n=== PRIVATE KEY saved to ${privPath} (keep offline, never commit) ===`);

} else if (args.includes("--issue")) {
  const licensee = get("--licensee", "Unknown");
  const tier     = get("--tier", "standard");
  const seats    = parseInt(get("--seats", "1"), 10);
  const exp      = get("--exp", null);
  const features = (get("--features", "") || "").split(",").filter(Boolean);
  const keyPath  = get("--key", "tools/private-key.json");

  const privJwk = JSON.parse(readFileSync(keyPath, "utf-8"));
  const privKey = await subtle.importKey(
    "jwk", privJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const payload = JSON.stringify({ licensee, tier, seats, exp, features });
  const payloadB64 = b64url(Buffer.from(payload));

  const sigBuf = await subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    privKey,
    Buffer.from(payload),
  );
  const sigB64 = b64url(sigBuf);

  const licenseKey = `${payloadB64}.${sigB64}`;
  console.log("\n=== LICENSE KEY ===");
  console.log(licenseKey);

} else {
  console.log("Usage:");
  console.log("  node tools/generate_license.mjs --gen-keys");
  console.log("  node tools/generate_license.mjs --issue --licensee 'Name' --tier pro --seats 5 --exp 2027-12-31 --features mailMerge,vectorPdf");
}
