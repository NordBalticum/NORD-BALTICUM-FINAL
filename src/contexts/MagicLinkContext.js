"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Wallet } from "ethers";

export const MagicLinkContext = createContext();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// AES šifravimui – slaptažodžio raktas (saugus local, gali būti ENV arba hardcoded)
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "fallback-secret";

// ✅ Pagalbinės šifravimo funkcijos
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async (password) => {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw", encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
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
  const encoded = encode(text);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
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
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const localWallet = await loadWalletFromStorage();
        if (localWallet) {
          setWallet(localWallet);
        } else {
          const newWallet = Wallet.createRandom();
          await saveWalletToStorage(newWallet);
          setWallet(newWallet);
          await saveWalletToDatabase(currentUser.email, newWallet.address);
        }
      }

      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          const localWallet = await loadWalletFromStorage();
          if (localWallet) {
            setWallet(localWallet);
          } else {
            const newWallet = Wallet.createRandom();
            await saveWalletToStorage(newWallet);
            setWallet(newWallet);
            await saveWalletToDatabase(currentUser.email, newWallet.address);
          }
        } else {
          setWallet(null);
          localStorage.removeItem("userWallet");
        }
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // ✅ OTP el. pašto loginas
  const loginWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      console.error("❌ Login error:", error.message);
    }
  };

  // ✅ Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWallet(null);
    localStorage.removeItem("userWallet");
  };

  // ✅ Saugo į localStorage (šifruotai)
  const saveWalletToStorage = async (wallet) => {
    if (!wallet?.privateKey) return;
    const encryptedKey = await encrypt(wallet.privateKey);
    const data = {
      address: wallet.address,
      privateKey: encryptedKey,
    };
    localStorage.setItem("userWallet", JSON.stringify(data));
  };

  // ✅ Gauna iš localStorage (ir iššifruoja)
  const loadWalletFromStorage = async () => {
    try {
      const data = localStorage.getItem("userWallet");
      if (!data) return null;
      const { privateKey } = JSON.parse(data);
      const decryptedKey = await decrypt(privateKey);
      return new Wallet(decryptedKey);
    } catch (err) {
      console.error("❌ Wallet decrypt error:", err);
      return null;
    }
  };

  // ✅ Įrašo tik adresą į DB
  const saveWalletToDatabase = async (email, address) => {
    try {
      const { error } = await supabase
        .from("wallets")
        .upsert({ email, address }, { onConflict: ["email"] });

      if (error) {
        console.error("❌ Supabase DB error:", error.message);
      }
    } catch (err) {
      console.error("❌ Supabase saveWallet error:", err);
    }
  };

  return (
    <MagicLinkContext.Provider
      value={{
        supabase,
        user,
        wallet,
        loading,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </MagicLinkContext.Provider>
  );
};

export const useMagicLink = () => useContext(MagicLinkContext);
