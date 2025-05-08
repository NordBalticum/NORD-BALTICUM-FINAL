// src/utils/aesDecrypt.js
"use client";

// ==============================================
// 🔐 AES-GCM 256-bit dešifravimas (Nord Balticum)
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
  }, false, ["decrypt"]);
}

// ==============================================
// 🔓 Dešifruoti šifruotą privKey iš Supabase
// ==============================================
export async function decryptKey(encryptedString) {
  try {
    const { iv, data } = JSON.parse(atob(encryptedString));
    const key = await getKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    return decode(decrypted);
  } catch (err) {
    console.error("❌ AES dešifravimo klaida:", err.message || err);
    throw new Error("❌ Nepavyko dešifruoti rakto");
  }
}
