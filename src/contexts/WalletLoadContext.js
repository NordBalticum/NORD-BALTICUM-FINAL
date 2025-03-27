"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Wallet } from "ethers";
import { createClient } from "@supabase/supabase-js";
import { useMagicLink } from "./MagicLinkContext";

const WalletLoadContext = createContext();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "nordbalticum-2024";
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async (password) => {
  const keyMaterial = await window.crypto.subtle.importKey("raw", encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nbc-salt"),
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
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encode(text));
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
};

const decrypt = async (cipher) => {
  try {
    const { iv, data } = JSON.parse(atob(cipher));
    const key = await getKey(ENCRYPTION_SECRET);
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, new Uint8Array(data));
    return decode(decrypted);
  } catch (e) {
    console.error("Decrypt error:", e);
    return null;
  }
};

export const WalletLoadProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [wallets, setWallets] = useState(null);
  const [loadingWallets, setLoadingWallets] = useState(true);

  useEffect(() => {
    const loadWallets = async () => {
      if (!user || !user.email) return;

      setLoadingWallets(true);

      const local = await loadFromLocal();
      if (local) {
        setWallets(local);
        setLoadingWallets(false);
        return;
      }

      const newWallet = Wallet.createRandom();
      const encryptedKey = await encrypt(newWallet.privateKey);

      const allWallets = {
        address: newWallet.address,
        privateKey: encryptedKey,
        networks: {
          eth: newWallet.address,
          bsc: newWallet.address,
          pol: newWallet.address,
          avax: newWallet.address,
        },
      };

      try {
        await supabase
          .from("wallets")
          .upsert(
            {
              user_id: user.id,
              email: user.email,
              ...allWallets.networks,
            },
            { onConflict: ["email"] }
          );
      } catch (err) {
        console.error("❌ Supabase wallet upsert failed:", err.message);
      }

      await saveToLocal(allWallets);
      setWallets(allWallets);
      setLoadingWallets(false);
    };

    loadWallets();
  }, [user]);

  const saveToLocal = async (walletObj) => {
    try {
      localStorage.setItem("userWallets", JSON.stringify(walletObj));
    } catch (e) {
      console.error("LocalStorage save error:", e);
    }
  };

  const loadFromLocal = async () => {
    try {
      const stored = localStorage.getItem("userWallets");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed;
    } catch (e) {
      console.error("LocalStorage load error:", e);
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
