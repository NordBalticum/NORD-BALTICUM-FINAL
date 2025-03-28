"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useMagicLink } from "./MagicLinkContext";

// Kontekstas
const WalletLoadContext = createContext();

// Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Konteksto tiekėjas
export const WalletLoadProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [wallets, setWallets] = useState(null);
  const [loadingWallets, setLoadingWallets] = useState(true);

  useEffect(() => {
    const loadWallet = async () => {
      if (!user?.email) return;

      setLoadingWallets(true);

      try {
        // 1. Bandome gauti iš DB
        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .eq("email", user.email)
          .single();

        if (error || !data) {
          console.warn("⚠️ Wallet not found in DB");
          setWallets(null); // nekurti naujo!
          return;
        }

        const walletObj = {
          address: data.bsc,
          networks: {
            bsc: data.bsc,
            tbnb: data.tbnb,
            eth: data.eth,
            pol: data.pol,
            avax: data.avax,
          },
        };

        setWallets(walletObj);
        localStorage.setItem("userWallets", JSON.stringify(walletObj));
      } catch (err) {
        console.error("❌ Failed to load wallet:", err.message);
      } finally {
        setLoadingWallets(false);
      }
    };

    loadWallet();
  }, [user]);

  return (
    <WalletLoadContext.Provider value={{ wallets, loadingWallets }}>
      {children}
    </WalletLoadContext.Provider>
  );
};

export const useWalletLoad = () => useContext(WalletLoadContext);
