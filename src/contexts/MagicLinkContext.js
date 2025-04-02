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
  const keyMaterial = await window.crypto.subtle.importKey("raw", encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
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
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encode(text));
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
};

const decrypt = async (ciphertext) => {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey(ENCRYPTION_SECRET);
  const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, new Uint8Array(data));
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

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        await loadWallet(currentUser.email);
        router.push("/dashboard");
      } else {
        setWallet(null);
        localStorage.clear();
        router.push("/");
      }
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  const loadWallet = async (email) => {
    try {
      const localKey = await loadPrivateKeyFromStorage();
      if (localKey) {
        const wallet = new Wallet(localKey);
        setWallet(generateWalletObject(wallet));
        return;
      }

      const db = await fetchUserWallet(email);
      if (db?.encrypted_key) {
        try {
          const decryptedKey = await decrypt(db.encrypted_key);
          const normalizedKey = decryptedKey.startsWith("0x") ? decryptedKey : `0x${decryptedKey}`;
          await savePrivateKeyToStorage(normalizedKey);
          const wallet = new Wallet(normalizedKey);
          setWallet(generateWalletObject(wallet));
          return;
        } catch (err) {
          console.error("Wallet decryption error:", err);
          return; // Saugiklis – nekurk naujo jei klaida
        }
      }

      // Tik jei nei local, nei DB nerasta
      const newWallet = Wallet.createRandom();
      const encryptedKey = await encrypt(newWallet.privateKey);
      await savePrivateKeyToStorage(newWallet.privateKey);
      await saveWalletToDB(email, encryptedKey, newWallet.address);
      setWallet(generateWalletObject(newWallet));
    } catch (err) {
      console.error("loadWallet error:", err);
    }
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
    localStorage.clear();
    router.push("/");
  };

  const savePrivateKeyToStorage = async (privateKey) => {
    localStorage.setItem("userPrivateKey", JSON.stringify({ key: privateKey }));
  };

  const loadPrivateKeyFromStorage = async () => {
    try {
      const data = localStorage.getItem("userPrivateKey");
      if (!data) return null;
      const { key } = JSON.parse(data);
      return key.startsWith("0x") ? key : `0x${key}`;
    } catch {
      return null;
    }
  };

  const saveWalletToDB = async (email, encryptedKey, address) => {
    const payload = {
      user_email: email,
      encrypted_key: encryptedKey,
      bnb_address: address,
      tbnb_address: address,
      eth_address: address,
      matic_address: address,
      avax_address: address,
    };

    try {
      const { error } = await supabase.from("wallets").upsert(payload, { onConflict: ["user_email"] });
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
    const { data, error } = await supabase.from("balances").select("*").eq("user_email", email);
    if (error) return [];
    return data;
  };

  const generateWalletObject = (wallet) => ({
    bnb: wallet.address,
    tbnb: wallet.address,
    eth: wallet.address,
    matic: wallet.address,
    avax: wallet.address,
  });

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
