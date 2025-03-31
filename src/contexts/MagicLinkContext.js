"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";
import { ethers } from "ethers";

const MagicLinkContext = createContext();
const ENCRYPTION_KEY = "NORD-BALTICUM-2025-SECRET";

export function MagicLinkProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);

  // === AES šifravimas ===
  const encrypt = (text) => CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  const decrypt = (cipher) => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  };

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

  const getOrCreateWallet = async (userId) => {
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (data?.address) return data.address;

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
  };

  // === Sesijos ir auth listeneris ===
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) console.warn("❌ Error fetching user:", error.message);

      setUser(user || null);
      setLoading(false);

      if (user?.id) {
        const addr = await getOrCreateWallet(user.id);
        setWallet({ address: addr });
      }
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
        if (session?.user?.id) {
          const addr = await getOrCreateWallet(session.user.id);
          setWallet({ address: addr });
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // === Magic Link login ===
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

  // === Atsijungimas ===
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
        loadingUser: loading,
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
