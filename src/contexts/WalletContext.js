"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Wallet } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useMagicLink } from "@/contexts/MagicLinkContext";

export const WalletContext = createContext();

const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "fallback-secret";

const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async (password) => {
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
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(ENCRYPTION_SECRET);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encode(text)
  );
  return btoa(
    JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
    })
  );
};

const decrypt = async (ciphertext) => {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey(ENCRYPTION_SECRET);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return decode(decrypted);
};

export const WalletProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      loadOrCreateWallet(user.email);
    }
  }, [user]);

  const loadOrCreateWallet = async (email) => {
    try {
      // 1. Check local storage
      const localKey = await loadPrivateKeyFromStorage();
      if (localKey) {
        const localWallet = new Wallet(localKey);
        setWallet(generateAddresses(localWallet));
        return;
      }

      // 2. Check database
      const db = await fetchWalletFromDB(email);
      if (db?.encrypted_key) {
        const decryptedKey = await decrypt(db.encrypted_key);
        await savePrivateKeyToStorage(decryptedKey);
        const dbWallet = new Wallet(decryptedKey);
        setWallet(generateAddresses(dbWallet));
        return;
      }

      // 3. Create new wallet
      const newWallet = Wallet.createRandom();
      const encryptedKey = await encrypt(newWallet.privateKey);
      await savePrivateKeyToStorage(newWallet.privateKey);
      await saveWalletToDB(email, encryptedKey, newWallet.address);
      setWallet(generateAddresses(newWallet));
    } catch (err) {
      console.error("Wallet error:", err);
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
    localStorage.setItem("userPrivateKey", JSON.stringify({ key: privateKey }));
  };

  const loadPrivateKeyFromStorage = async () => {
    try {
      const data = localStorage.getItem("userPrivateKey");
      if (!data) return null;
      const { key } = JSON.parse(data);
      return key;
    } catch {
      return null;
    }
  };

  const fetchWalletFromDB = async (email) => {
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_email", email)
      .maybeSingle();

    return error ? null : data;
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

    if (error) console.error("Save wallet to DB failed:", error.message);
  };

  return (
    <WalletContext.Provider value={{ wallet, loading }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
