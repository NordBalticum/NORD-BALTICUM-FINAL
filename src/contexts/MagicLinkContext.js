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

    if (data?.address) {
      // Jei adresas jau yra, bet neturim localStorage private key – sukurti naują
      if (!getPrivateKey()) {
        console.warn("⚠️ Missing local private key. Generating new...");
        const newWallet = ethers.Wallet.createRandom();
        storePrivateKey(newWallet.privateKey);
      }
      return data.address;
    }

    // Sukuria naują piniginę
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

  // === Sesijos ir piniginės init ===
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const { data, error } = await supabase.auth.getUser();
      if (error) console.warn("❌ Error fetching user:", error.message);

      const fetchedUser = data?.user || null;
      setUser(fetchedUser);

      if (fetchedUser?.id) {
        try {
          const address = await getOrCreateWallet(fetchedUser.id);
          setWallet({ address });
        } catch (e) {
          console.error("❌ Wallet setup failed:", e.message);
        }
      }

      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const loggedUser = session?.user || null;
        setUser(loggedUser);

        if (loggedUser?.id) {
          try {
            const address = await getOrCreateWallet(loggedUser.id);
            setWallet({ address });
          } catch (e) {
            console.error("❌ Wallet reload failed:", e.message);
          }
        } else {
          setWallet(null);
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
