"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { Wallet } from "ethers";

export const MagicLinkContext = createContext();

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

export const MagicLinkProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://nordbalticum.com";

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        await loadWallet(currentUser.email);
        router.push("/dashboard");
      }

      setLoading(false);
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          await loadWallet(currentUser.email);
          router.push("/dashboard");
        } else {
          setWallet(null);
          localStorage.removeItem("userWallet");
          router.push("/");
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [router]);

  const loadWallet = async (email) => {
    // 1. LOCAL – su privatu raktu
    const local = await loadWalletFromStorage();
    if (local) {
      setWallet(local);
      return;
    }

    // 2. SUPABASE – grąžinam tik adresus kaip objektą
    const db = await fetchUserWallet(email);
    if (db && db.bnb_address) {
      const walletObject = {
        bnb: db.bnb_address,
        tbnb: db.tbnb_address,
        eth: db.eth_address,
        matic: db.matic_address,
        avax: db.avax_address,
      };
      setWallet(walletObject);
      return;
    }

    // 3. NĖRA – kuriam naują, saugom visur
    const newWallet = Wallet.createRandom();
    await saveWalletToStorage(newWallet);
    await saveAllNetworkAddressesToDB(email, newWallet.address);
    const walletObject = {
      bnb: newWallet.address,
      tbnb: newWallet.address,
      eth: newWallet.address,
      matic: newWallet.address,
      avax: newWallet.address,
    };
    setWallet(walletObject);
  };

  const signInWithMagicLink = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/dashboard` },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWallet(null);
    localStorage.removeItem("userWallet");
    router.push("/");
  };

  const saveWalletToStorage = async (wallet) => {
    if (!wallet?.privateKey) return;
    const encryptedKey = await encrypt(wallet.privateKey);
    const data = { address: wallet.address, privateKey: encryptedKey };
    localStorage.setItem("userWallet", JSON.stringify(data));
  };

  const loadWalletFromStorage = async () => {
    try {
      const data = localStorage.getItem("userWallet");
      if (!data) return null;
      const { privateKey } = JSON.parse(data);
      const decryptedKey = await decrypt(privateKey);
      return new Wallet(decryptedKey);
    } catch (err) {
      return null;
    }
  };

  const saveAllNetworkAddressesToDB = async (email, address) => {
    const payload = {
      user_email: email,
      bnb_address: address,
      tbnb_address: address,
      eth_address: address,
      matic_address: address,
      avax_address: address,
    };

    try {
      const { error } = await supabase
        .from("wallets")
        .upsert(payload, { onConflict: ["user_email"] });
      if (error) console.error("Save to DB failed:", error.message);
    } catch (err) {
      console.error("DB error:", err);
    }
  };

  const fetchUserWallet = async (email) => {
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_email", email)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (err) {
      return null;
    }
  };

  const fetchUserBalances = async (email) => {
    const { data, error } = await supabase
      .from("balances")
      .select("*")
      .eq("user_email", email);
    if (error) return [];
    return data;
  };

  return (
    <MagicLinkContext.Provider
      value={{
        user,
        wallet,
        loading,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
        fetchUserWallet,
        fetchUserBalances,
      }}
    >
      {children}
    </MagicLinkContext.Provider>
  );
};

export const useMagicLink = () => useContext(MagicLinkContext);
