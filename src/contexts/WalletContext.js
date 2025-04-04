"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Wallet, JsonRpcProvider } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useMagicLink } from "@/contexts/MagicLinkContext";

export const WalletContext = createContext();

// --- Encryption/Decryption ---
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "nordbalticum-fallback";

const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

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
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
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

// --- Wallet Provider ---
export const WalletProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNetwork, setActiveNetwork] = useState("eth");

  useEffect(() => {
    if (!user?.email || typeof window === "undefined") {
      setLoading(false);
      return;
    }
    loadOrCreateWallet(user.email);
  }, [user]);

  const loadOrCreateWallet = async (email) => {
    setLoading(true);
    try {
      const localKey = await loadPrivateKeyFromStorage();
      if (localKey) {
        setWallet(await generateWallets(localKey));
        return;
      }

      const db = await fetchWalletFromDB(email);
      if (db?.encrypted_key) {
        const decryptedKey = await decrypt(db.encrypted_key);
        await savePrivateKeyToStorage(decryptedKey);
        setWallet(await generateWallets(decryptedKey));
        return;
      }

      const newWallet = Wallet.createRandom();
      const encryptedKey = await encrypt(newWallet.privateKey);
      await savePrivateKeyToStorage(newWallet.privateKey);
      await saveWalletToDB(email, encryptedKey, newWallet.address);
      setWallet(await generateWallets(newWallet.privateKey));
    } catch (err) {
      console.error("Wallet error:", err);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  const generateWallets = async (privateKey) => {
    const rpcUrls = {
      eth: "https://rpc.ankr.com/eth",
      bnb: "https://bsc-dataseed.binance.org",
      tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
      matic: "https://polygon-rpc.com",
      avax: "https://api.avax.network/ext/bc/C/rpc",
    };
    const signers = {};
    for (const [network, url] of Object.entries(rpcUrls)) {
      signers[network] = new Wallet(privateKey, new JsonRpcProvider(url));
    }
    return { privateKey, signers };
  };

  const savePrivateKeyToStorage = async (privateKey) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("userPrivateKey", JSON.stringify({ key: privateKey }));
  };

  const loadPrivateKeyFromStorage = async () => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("userPrivateKey");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.key || null;
  };

  const exportPrivateKey = async () => {
    if (typeof window === "undefined") return null;
    return await loadPrivateKeyFromStorage();
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
    <WalletContext.Provider
      value={{
        wallet,
        loading,
        exportPrivateKey,
        activeNetwork,
        setActiveNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
