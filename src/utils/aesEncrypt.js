// src/utils/aesEncrypt.js
"use client";

// ==============================================
// 🔐 AES-GCM 256-bit šifravimas (Nord Balticum)
// ==============================================

const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

async function getKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret) throw new Error("❌ AES slaptažodis nerastas .env faile");

  const baseKey = await crypto.subtle.importKey(
    "raw", encode(secret),
    { name: "PBKDF2" }, false, ["deriveKey"]
  );

  return crypto.subtle.deriveKey({
    name: "PBKDF2",
    salt: encode("nordbalticum-salt"),
    iterations: 100_000,
    hash: "SHA-256"
  }, baseKey, {
    name: "AES-GCM",
    length: 256
  }, false, ["encrypt"]);
}

// ==============================================
// 🔐 Užšifruoti privKey → base64 JSON {iv, data}
// ==============================================
export async function encryptKey(plainText) {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await getKey();
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encode(plainText)
    );

    return btoa(JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
    }));
  } catch (err) {
    console.error("❌ AES šifravimo klaida:", err.message || err);
    throw new Error("❌ Nepavyko užšifruoti rakto");
  }
}
