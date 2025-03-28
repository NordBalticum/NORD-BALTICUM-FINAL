"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { createClient } from "@supabase/supabase-js";
import { useMagicLink } from "./MagicLinkContext";

const GenerateWalletContext = createContext();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SUPPORTED_NETWORKS = {
  BNB: "Binance Smart Chain",
  TBNB: "BSC Testnet",
  ETH: "Ethereum",
  POL: "Polygon",
  AVAX: "Avalanche",
};

// AES
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "nordbalticum-2024";
const SALT = "nbc-salt";

const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async (password) => {
  const keyMaterial = await crypto.subtle.importKey("raw", encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
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
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(ENCRYPTION_SECRET);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encode(text));
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
};

const decrypt = async (cipherText) => {
  try {
    const { iv, data } = JSON.parse(atob(cipherText));
    const key = await getKey(ENCRYPTION_SECRET);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    return decode(decrypted);
  } catch (err) {
    console.error("❌ Decryption failed:", err.message);
    return null;
  }
};

export const GenerateWalletProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [generatedWallets, setGeneratedWallets] = useState({});
  const [loadingGenerate, setLoadingGenerate] = useState(true);

  useEffect(() => {
    const initializeWallets = async () => {
      if (!user?.email || !user?.id) return setLoadingGenerate(false);

      // 1. Check localStorage
      const cached = localStorage.getItem("userWallets");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setGeneratedWallets(parsed);
          setLoadingGenerate(false);
          return;
        } catch {
          localStorage.removeItem("userWallets");
        }
      }

      // 2. Try loading from Supabase
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("email", user.email)
        .single();

      if (data) {
        const walletObj = {
          address: data.bsc,
          privateKey: null, // Optional, could decrypt if needed
          networks: {
            bsc: data.bsc,
            tbnb: data.tbnb,
            eth: data.eth,
            pol: data.pol,
            avax: data.avax,
          },
        };
        setGeneratedWallets(walletObj);
        localStorage.setItem("userWallets", JSON.stringify(walletObj));
        setLoadingGenerate(false);
        return;
      }

      // 3. Generate new wallets if not found
      const newWallet = ethers.Wallet.createRandom();
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

      await supabase.from("wallets").insert({
        user_id: user.id,
        email: user.email,
        ...walletObj.networks,
        private_key_encrypted: encryptedKey,
      });

      localStorage.setItem("userWallets", JSON.stringify(walletObj));
      setGeneratedWallets(walletObj);
      setLoadingGenerate(false);
    };

    initializeWallets();
  }, [user]);

  return (
    <GenerateWalletContext.Provider
      value={{
        generatedWallets,
        loadingGenerate,
        encrypt,
        decrypt,
      }}
    >
      {children}
    </GenerateWalletContext.Provider>
  );
};

export const useGenerateWallet = () => useContext(GenerateWalletContext);
