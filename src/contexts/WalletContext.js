"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Wallet } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useMagicLink } from "@/contexts/MagicLinkContext";

export const WalletContext = createContext();

const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "nordbalticum-fallback";

// === SAFE ENCODING UTILS ===
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

// === SECURE CRYPTO KEYS ===
const getKey = async (password) => {
  if (typeof window === "undefined") return null;

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

const encrypt = async (text) => {
  if (typeof window === "undefined") return null;

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(ENCRYPTION_SECRET);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encode(text)
  );

  return btoa(
    JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) })
  );
};

const decrypt = async (ciphertext) => {
  if (typeof window === "undefined") return null;

  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey(ENCRYPTION_SECRET);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );

  return decode(decrypted);
};

// === MAIN PROVIDER ===
export const WalletProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (user?.email) {
      loadOrCreateWallet(user.email);
    } else {
      clearWallet();
    }
  }, [user]);

  const clearWallet = () => {
    setWallet(null);
    setLoading(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("userPrivateKey");
    }
  };

  const loadOrCreateWallet = async (email) => {
    setLoading(true);
    try {
      const localKey = await loadPrivateKeyFromStorage();
      if (localKey) {
        const localWallet = new Wallet(localKey);
        setWallet(generateAddresses(localWallet));
        return;
      }

      const db = await fetchWalletFromDB(email);
      if (db?.encrypted_key) {
        const decryptedKey = await decrypt(db.encrypted_key);
        await savePrivateKeyToStorage(decryptedKey);
        const dbWallet = new Wallet(decryptedKey);
        setWallet(generateAddresses(dbWallet));
        return;
      }

      // CREATE NEW WALLET
      const newWallet = Wallet.createRandom();
      const encryptedKey = await encrypt(newWallet.privateKey);
      await savePrivateKeyToStorage(newWallet.privateKey);
      await saveWalletToDB(email, encryptedKey, newWallet.address);
      setWallet(generateAddresses(newWallet));
    } catch (err) {
      console.error("Wallet error:", err);
      clearWallet();
    } finally {
      setLoading(false);
    }
  };

  const generateAddresses = (wallet) => ({
    bnb: wallet.address,
    tbnb: wallet.address,
    eth: wallet.address,
    matic: wallet.address,
    avax: wallet.address,
  });

  const savePrivateKeyToStorage = async (privateKey) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("userPrivateKey", JSON.stringify({ key: privateKey }));
    } catch (err) {
      console.error("Saving private key failed:", err);
    }
  };

  const loadPrivateKeyFromStorage = async () => {
    if (typeof window === "undefined") return null;
    try {
      const item = localStorage.getItem("userPrivateKey");
      if (!item) return null;
      const parsed = JSON.parse(item);
      return parsed?.key || null;
    } catch (err) {
      return null;
    }
  };

  const exportPrivateKey = async () => {
    const key = await loadPrivateKeyFromStorage();
    return key || null;
  };

  const fetchWalletFromDB = async (email) => {
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_email", email)
      .maybeSingle();

    if (error) {
      console.error("DB fetch error:", error.message);
      return null;
    }

    return data;
  };

  const saveWalletToDB = async (email, encrypted_key, address) => {
    const payload = {
      user_email: email,
      encrypted_key,
      bnb_address: address,
      tbnb_address: address,
      eth_address: address,
      matic_address: address,
      avax_address: address,
    };

    const { error } = await supabase
      .from("wallets")
      .upsert(payload, { onConflict: ["user_email"] });

    if (error) {
      console.error("DB save error:", error.message);
    }
  };

  return (
    <WalletContext.Provider value={{ wallet, loading, exportPrivateKey }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
