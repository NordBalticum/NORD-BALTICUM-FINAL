"use client";

import React, { createContext, useContext, useState } from "react";
import { ethers } from "ethers";

const SUPPORTED_NETWORKS = {
  BNB: "Binance Smart Chain",
  TBNB: "BSC Testnet",
  ETH: "Ethereum",
  POL: "Polygon",
  AVAX: "Avalanche",
};

const GenerateWalletContext = createContext();

// === AES ENCRYPTION ===
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
  const [generatedWallets, setGeneratedWallets] = useState({});
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  // ✅ Vienos piniginės generavimas
  const generateWalletForNetwork = async (networkSymbol) => {
    try {
      const wallet = ethers.Wallet.createRandom();
      const encryptedKey = await encrypt(wallet.privateKey);
      return {
        address: wallet.address,
        privateKey: encryptedKey,
        network: SUPPORTED_NETWORKS[networkSymbol],
        symbol: networkSymbol,
      };
    } catch (err) {
      console.error(`❌ Wallet generation error (${networkSymbol}):`, err.message);
      return null;
    }
  };

  // ✅ Visų tinklų piniginių generavimas
  const generateAllWallets = async () => {
    setLoadingGenerate(true);
    try {
      const newWallets = {};
      for (const symbol of Object.keys(SUPPORTED_NETWORKS)) {
        const wallet = await generateWalletForNetwork(symbol);
        if (wallet) newWallets[symbol] = wallet;
      }
      setGeneratedWallets(newWallets);
      localStorage.setItem("userWallets", JSON.stringify(newWallets));
      console.log("✅ All wallets generated and encrypted.");
    } catch (err) {
      console.error("❌ Wallet generation failed:", err.message);
    } finally {
      setLoadingGenerate(false);
    }
  };

  // ✅ Iš localStorage gauti sugeneruotas pinigines
  const getStoredWallets = () => {
    try {
      const stored = localStorage.getItem("userWallets");
      if (stored) {
        const parsed = JSON.parse(stored);
        setGeneratedWallets(parsed);
        return parsed;
      }
      return null;
    } catch (err) {
      console.error("❌ Failed to load stored wallets:", err.message);
      return null;
    }
  };

  return (
    <GenerateWalletContext.Provider
      value={{
        generatedWallets,
        loadingGenerate,
        generateAllWallets,
        getStoredWallets,
        encrypt,
        decrypt,
      }}
    >
      {children}
    </GenerateWalletContext.Provider>
  );
};

export const useGenerateWallet = () => useContext(GenerateWalletContext);
