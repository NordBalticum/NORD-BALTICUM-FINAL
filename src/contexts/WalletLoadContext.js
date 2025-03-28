"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WalletLoadContext = createContext();

export const WalletLoadProvider = ({ children }) => {
  const [wallets, setWallets] = useState(null);
  const [loadingWallets, setLoadingWallets] = useState(true);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user?.email) {
          console.warn("⚠️ No active session or user email.");
          setLoadingWallets(false);
          return;
        }

        const email = session.user.email;

        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .eq("email", email)
          .single();

        if (error) {
          console.warn("⚠️ Wallet fetch error:", error.message);
          setWallets(null);
        } else {
          setWallets(data);
        }
      } catch (err) {
        console.error("❌ Wallet load error:", err?.message || err);
        setWallets(null);
      } finally {
        setLoadingWallets(false);
      }
    };

    fetchWallets();
  }, []);

  return (
    <WalletLoadContext.Provider value={{ wallets, loadingWallets }}>
      {children}
    </WalletLoadContext.Provider>
  );
};

export const useWalletLoad = () => useContext(WalletLoadContext);
