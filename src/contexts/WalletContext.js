"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Wallet, JsonRpcProvider } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useMagicLink } from "@/contexts/MagicLinkContext";

// === Kuriam Context'ą ===
export const WalletContext = createContext();

const RPC_URLS = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

// === Šifravimo funkcijos ===
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
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
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

// === Wallet Provider ===
export const WalletProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNetwork, setActiveNetwork] = useState("eth");

  useEffect(() => {
    if (typeof window !== "undefined" && user?.email) {
      loadWallet(user.email);
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadWallet = async (email) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_email", email)
        .maybeSingle();

      if (error) {
        console.error("Supabase fetch error:", error.message);
        setWallet(null);
        return;
      }

      if (data && data.encrypted_key) {
        const decryptedPrivateKey = await decrypt(data.encrypted_key);
        const wallets = generateWallets(decryptedPrivateKey);
        setWallet(wallets);
      } else {
        const newWallet = Wallet.createRandom();
        const encryptedPrivateKey = await encrypt(newWallet.privateKey);

        // Išsaugom į Supabase
        const payload = {
          user_email: email,
          eth_address: newWallet.address,
          bnb_address: newWallet.address,
          tbnb_address: newWallet.address,
          matic_address: newWallet.address,
          avax_address: newWallet.address,
          encrypted_key: encryptedPrivateKey,
        };

        const { error: insertError } = await supabase
          .from("wallets")
          .upsert(payload, { onConflict: ["user_email"] });

        if (insertError) {
          console.error("Supabase insert error:", insertError.message);
        } else {
          const wallets = generateWallets(newWallet.privateKey);
          setWallet(wallets);
        }
      }
    } catch (err) {
      console.error("Load wallet error:", err);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  const generateWallets = (privateKey) => {
    const signers = {};
    for (const [network, rpcUrl] of Object.entries(RPC_URLS)) {
      signers[network] = new Wallet(privateKey, new JsonRpcProvider(rpcUrl));
    }
    return { privateKey, signers };
  };

  return (
    <WalletContext.Provider value={{ wallet, loading, activeNetwork, setActiveNetwork }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
