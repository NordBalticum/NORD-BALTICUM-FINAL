"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";
import { ethers } from "ethers";

const MagicLinkContext = createContext();
const ENCRYPTION_KEY = "NORD-BALTICUM-2025-SECRET";

export function MagicLinkProvider({ children }) {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  // === AES šifravimas / dešifravimas ===
  const encrypt = (text) => CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  const decrypt = (cipher) => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  };

  // === LocalStorage Private Key valdymas ===
  const storePrivateKey = (pk) => {
    try {
      const encrypted = encrypt(pk);
      localStorage.setItem("nbc_private_key", encrypted);
    } catch (e) {
      console.error("❌ Failed to store key:", e.message);
    }
  };

  const getPrivateKey = () => {
    try {
      const cipher = localStorage.getItem("nbc_private_key");
      return cipher ? decrypt(cipher) : null;
    } catch {
      return null;
    }
  };

  const getWalletAddress = () => {
    const pk = getPrivateKey();
    if (!pk) return null;
    try {
      return new ethers.Wallet(pk).address;
    } catch {
      return null;
    }
  };

  // === Wallet registracija / gavimas iš DB ===
  const getOrCreateWallet = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.address) {
        if (!getPrivateKey()) {
          const newWallet = ethers.Wallet.createRandom();
          storePrivateKey(newWallet.privateKey);
        }
        return data.address;
      }

      const newWallet = ethers.Wallet.createRandom();
      storePrivateKey(newWallet.privateKey);

      const { error: insertError } = await supabase.from("wallets").insert([
        {
          user_id: userId,
          address: newWallet.address,
          network: "multi",
        },
      ]);

      if (insertError) throw insertError;
      return newWallet.address;
    } catch (err) {
      console.error("❌ Wallet error:", err.message);
      return null;
    }
  };

  // === Inicijuoja vartotojo sesiją ===
  const initSession = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn("❌ Auth fetch error:", error.message);
        setUser(null);
        setWallet(null);
        return;
      }

      const currentUser = data?.user || null;
      setUser(currentUser);

      if (currentUser?.id) {
        const address = await getOrCreateWallet(currentUser.id);
        if (address) setWallet({ address });
      } else {
        setWallet(null);
      }
    } catch (err) {
      console.error("❌ Session init error:", err.message);
    } finally {
      setLoading(false);
      setSessionChecked(true);
    }
  };

  useEffect(() => {
    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const loggedUser = session?.user || null;
        setUser(loggedUser);

        if (loggedUser?.id) {
          const address = await getOrCreateWallet(loggedUser.id);
          if (address) setWallet({ address });
        } else {
          setWallet(null);
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // === MagicLink prisijungimas ===
  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw new Error("Magic Link error: " + error.message);
  };

  // === Google OAuth login ===
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw new Error("Google login error: " + error.message);
  };

  // === Logout ===
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("Logout error: " + error.message);

    setUser(null);
    setWallet(null);
    localStorage.removeItem("nbc_private_key");
  };

  return (
    <MagicLinkContext.Provider
      value={{
        user,
        loadingUser: loading || !sessionChecked,
        wallet,
        signInWithEmail,
        signInWithGoogle,
        signOut,
        getPrivateKey,
        getWalletAddress,
      }}
    >
      {children}
    </MagicLinkContext.Provider>
  );
}

export const useMagicLink = () => useContext(MagicLinkContext);
