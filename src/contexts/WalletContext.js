"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Wallet, JsonRpcProvider } from "ethers";  // Correct ethers.js imports
import { supabase } from "@/utils/supabaseClient";
import { useMagicLink } from "@/contexts/MagicLinkContext";

export const WalletContext = createContext();

// Encryption and Decryption Utilities
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "nordbalticum-fallback";

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

// Wallet Provider
export const WalletProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const [wallets, setWallets] = useState({
    eth: null,
    bnb: null,
    matic: null,
    avax: null,
    tbnb: null,
  });

  useEffect(() => {
    const init = async () => {
      if (!user?.email || typeof window === "undefined") {
        setWallet(null);
        setLoading(false);
        return;
      }

      await loadOrCreateWallet(user.email);
    };

    init();
  }, [user]);

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

      const newWallet = Wallet.createRandom();
      const encryptedKey = await encrypt(newWallet.privateKey);
      await savePrivateKeyToStorage(newWallet.privateKey);
      await saveWalletToDB(email, encryptedKey, newWallet.address);
      setWallet(generateAddresses(newWallet));
    } catch (err) {
      console.error("Wallet error:", err);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  const generateAddresses = (wallet) => {
    const providersMap = {
      eth: new JsonRpcProvider("https://rpc.ankr.com/eth"),
      bnb: new JsonRpcProvider("https://bsc-dataseed.binance.org"),
      tbnb: new JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545"),
      matic: new JsonRpcProvider("https://polygon-rpc.com"),
      avax: new JsonRpcProvider("https://api.avax.network/ext/bc/C/rpc"),
    };

    const signers = Object.keys(providersMap).reduce((acc, network) => {
      acc[network] = new Wallet(wallet.privateKey, providersMap[network]);
      return acc;
    }, {});

    return {
      wallet,
      signers,
    };
  };

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
    } catch {
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
    <WalletContext.Provider value={{ wallet, wallets, loading, exportPrivateKey }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
