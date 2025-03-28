"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Wallet } from "ethers";
import { createClient } from "@supabase/supabase-js";
import { useMagicLink } from "./MagicLinkContext";

// Kontekstas
const WalletLoadContext = createContext();

// Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Šifravimo parametrai
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "nordbalticum-2024";
const SALT = "nbc-salt";
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async (password) => {
  const keyMaterial = await window.crypto.subtle.importKey("raw", encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
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
  } catch (err) {
    console.error("❌ Decryption failed:", err);
    return null;
  }
};

export const WalletLoadProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [wallets, setWallets] = useState(null);
  const [loadingWallets, setLoadingWallets] = useState(true);

  useEffect(() => {
    const loadWallet = async () => {
      if (!user?.email) return;
      setLoadingWallets(true);

      // 1. Bandome gauti iš DB
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("email", user.email)
        .single();

      if (data && !error) {
        const walletObj = {
          address: data.bsc,
          privateKey: null,
          networks: {
            bsc: data.bsc,
            tbnb: data.tbnb,
            eth: data.eth,
            pol: data.pol,
            avax: data.avax,
          },
        };
        setWallets(walletObj);
        localStorage.setItem("userWallets", JSON.stringify(walletObj));
        setLoadingWallets(false);
        return;
      }

      // 2. Bandome gauti iš localStorage
      const local = localStorage.getItem("userWallets");
      if (local) {
        const parsed = JSON.parse(local);
        setWallets(parsed);
        setLoadingWallets(false);
        return;
      }

      // 3. Jei nieko nėra – sukurti naują
      const newWallet = Wallet.createRandom();
      const encryptedKey = await encrypt(newWallet.privateKey);

      const walletObj = {
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

      // 4. Išsaugoti į DB
      await supabase.from("wallets").insert({
        user_id: user.id,
        email: user.email,
        ...walletObj.networks,
      });

      // 5. Į localStorage
      localStorage.setItem("userWallets", JSON.stringify(walletObj));
      setWallets(walletObj);
      setLoadingWallets(false);
    };

    loadWallet();
  }, [user]);

  return (
    <WalletLoadContext.Provider value={{ wallets, loadingWallets }}>
      {children}
    </WalletLoadContext.Provider>
  );
};

export const useWalletLoad = () => useContext(WalletLoadContext);
