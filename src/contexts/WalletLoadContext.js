"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Wallet } from "ethers";
import { createClient } from "@supabase/supabase-js";
import { useMagicLink } from "./MagicLinkContext";

// === Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WalletLoadContext = createContext();

// === Encryption config
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "nordbalticum-2024";
const SALT = "nbc-salt";

const encode = (text) => new TextEncoder().encode(text);
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
      salt: encode(SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

const encrypt = async (plainText) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(ENCRYPTION_SECRET);
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encode(plainText));
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
};

const decrypt = async (cipherText) => {
  try {
    const { iv, data } = JSON.parse(atob(cipherText));
    const key = await getKey(ENCRYPTION_SECRET);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    return decode(decrypted);
  } catch (err) {
    console.error("❌ Decryption failed:", err);
    return null;
  }
};

// === Wallet Provider
export const WalletLoadProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [wallets, setWallets] = useState(null);
  const [loadingWallets, setLoadingWallets] = useState(true);

  useEffect(() => {
    const loadWallet = async () => {
      if (!user?.email) return;

      setLoadingWallets(true);

      // 1. Try localStorage
      const local = await loadFromLocal();
      if (local) {
        setWallets(local);
        setLoadingWallets(false);
        return;
      }

      // 2. Create new wallet
      const newWallet = Wallet.createRandom();
      const encryptedKey = await encrypt(newWallet.privateKey);

      const walletObject = {
        address: newWallet.address,
        privateKey: encryptedKey,
        networks: {
          bsc: newWallet.address,
          tbnb: newWallet.address,
          eth: newWallet.address,
          pol: newWallet.address,
          avax: newWallet.address,
        },
      };

      // 3. Save to Supabase
      try {
        await supabase.from("wallets").upsert(
          {
            user_id: user.id,
            email: user.email,
            ...walletObject.networks,
          },
          { onConflict: ["email"] }
        );
      } catch (err) {
        console.error("❌ Supabase wallet save failed:", err.message);
      }

      // 4. Save locally
      await saveToLocal(walletObject);
      setWallets(walletObject);
      setLoadingWallets(false);
    };

    loadWallet();
  }, [user]);

  const saveToLocal = async (walletObj) => {
    try {
      localStorage.setItem("userWallets", JSON.stringify(walletObj));
    } catch (err) {
      console.error("❌ LocalStorage save failed:", err);
    }
  };

  const loadFromLocal = async () => {
    try {
      const stored = localStorage.getItem("userWallets");
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (err) {
      console.error("❌ LocalStorage load failed:", err);
      return null;
    }
  };

  return (
    <WalletLoadContext.Provider value={{ wallets, loadingWallets }}>
      {children}
    </WalletLoadContext.Provider>
  );
};

export const useWalletLoad = () => useContext(WalletLoadContext);
