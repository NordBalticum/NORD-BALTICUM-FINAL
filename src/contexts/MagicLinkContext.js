"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Wallet } from "ethers";

export const MagicLinkContext = createContext();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
        const localWallet = loadWalletFromStorage();
        if (localWallet) {
          setWallet(localWallet);
        } else {
          const newWallet = Wallet.createRandom();
          saveWalletToStorage(newWallet);
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
          const localWallet = loadWalletFromStorage();
          if (localWallet) {
            setWallet(localWallet);
          } else {
            const newWallet = Wallet.createRandom();
            saveWalletToStorage(newWallet);
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

  // ✅ OTP login
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

  // ✅ Save to localStorage
  const saveWalletToStorage = (wallet) => {
    if (!wallet?.privateKey) return;
    const data = {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
    localStorage.setItem("userWallet", JSON.stringify(data));
  };

  // ✅ Load from localStorage
  const loadWalletFromStorage = () => {
    try {
      const data = localStorage.getItem("userWallet");
      if (!data) return null;
      const { privateKey } = JSON.parse(data);
      return new Wallet(privateKey);
    } catch (err) {
      console.error("❌ Wallet load error:", err);
      return null;
    }
  };

  // ✅ Save to Supabase DB
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
