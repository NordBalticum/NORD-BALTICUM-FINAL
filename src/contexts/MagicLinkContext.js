"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Wallet } from "ethers";

export const MagicLinkContext = createContext();

// Supabase klientas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// AES-GCM šifravimo raktas
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "nordbalticum-2024";

// === ENCODE / DECODE ===
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

// === Gauti AES raktą iš slaptažodžio ===
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

// === Šifravimas ===
const encrypt = async (text) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(ENCRYPTION_SECRET);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encode(text)
  );
  return btoa(JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  }));
};

// === Iššifravimas ===
const decrypt = async (cipher) => {
  const { iv, data } = JSON.parse(atob(cipher));
  const key = await getKey(ENCRYPTION_SECRET);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return decode(decrypted);
};

// === MagicLinkProvider komponentas ===
export const MagicLinkProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biometricEmail, setBiometricEmail] = useState(null);

  // === INIT: Tikrina sesiją, krauna wallet, sukuria jei reikia ===
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      const storedBioEmail = localStorage.getItem("biometric_user");
      if (storedBioEmail) setBiometricEmail(storedBioEmail);

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

    // === Reagavimas į auth pokyčius ===
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        const storedBiometric = localStorage.getItem("biometric_user");
        if (storedBiometric) setBiometricEmail(storedBiometric);

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

  // === OTP autentifikacija el. paštu ===
  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) console.error("OTP Login Error:", error.message);
  };

  // === Google OAuth ===
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) console.error("Google Login Error:", error.message);
  };

  // === Prisijungimas per biometrinį email (lokaliai) ===
  const loginWithBiometrics = async () => {
    const bioEmail = localStorage.getItem("biometric_user");
    if (bioEmail) await signInWithEmail(bioEmail);
  };

  // === Atsijungimas ===
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWallet(null);
    localStorage.removeItem("userWallet");
  };

  // === Piniginės saugojimas naršyklėje su šifravimu ===
  const saveWalletToStorage = async (wallet) => {
    if (!wallet?.privateKey) return;
    const encryptedKey = await encrypt(wallet.privateKey);
    localStorage.setItem("userWallet", JSON.stringify({
      address: wallet.address,
      privateKey: encryptedKey,
    }));
  };

  // === Piniginės atkūrimas iš naršyklės ===
  const loadWalletFromStorage = async () => {
    try {
      const data = localStorage.getItem("userWallet");
      if (!data) return null;
      const { privateKey } = JSON.parse(data);
      const decryptedKey = await decrypt(privateKey);
      return new Wallet(decryptedKey);
    } catch (err) {
      console.error("Wallet decrypt error:", err);
      return null;
    }
  };

  // === Wallet adresas įrašomas į DB, jei jo nėra ===
  const saveWalletToDatabase = async (email, address) => {
    try {
      const { error } = await supabase
        .from("wallets")
        .upsert({ email, address }, { onConflict: ["email"] });

      if (error) console.error("Supabase DB error:", error.message);
    } catch (err) {
      console.error("Supabase saveWallet error:", err);
    }
  };

  return (
    <MagicLinkContext.Provider
      value={{
        supabase,
        user,
        wallet,
        loading,
        biometricEmail,
        signInWithEmail,
        loginWithGoogle,
        loginWithBiometrics,
        logout,
      }}
    >
      {children}
    </MagicLinkContext.Provider>
  );
};

// === Custom hook naudoti kontekstui ===
export const useMagicLink = () => useContext(MagicLinkContext);
