"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useMagicLink } from "./MagicLinkContext";

const WalletLoadContext = createContext();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const WalletLoadProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [wallets, setWallets] = useState(null);
  const [walletsReady, setWalletsReady] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(true);

  useEffect(() => {
    const loadWallet = async () => {
      if (!user?.email) {
        setLoadingWallets(false);
        setWalletsReady(true);
        return;
      }

      setLoadingWallets(true);

      try {
        // 1. LOCALSTORAGE
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("userWallets");
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setWallets(parsed);
              if (process.env.NODE_ENV === "development") console.log("✅ Piniginė iš localStorage.");
              setLoadingWallets(false);
              setWalletsReady(true);
              return;
            } catch {
              console.warn("⚠️ Netinkamas localStorage formatas – valoma.");
              localStorage.removeItem("userWallets");
            }
          }
        }

        // 2. SUPABASE DB
        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .eq("email", user.email)
          .single();

        if (error || !data) {
          console.warn("⚠️ Piniginė nerasta Supabase DB.");
          setWallets(null);
          setLoadingWallets(false);
          setWalletsReady(true);
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
        if (typeof window !== "undefined") {
          localStorage.setItem("userWallets", JSON.stringify(walletObj));
        }
        if (process.env.NODE_ENV === "development") console.log("✅ Piniginė įkelta iš Supabase.");
      } catch (err) {
        console.error("❌ Klaida kraunant piniginę:", err?.message || err);
        setWallets(null);
      } finally {
        setLoadingWallets(false);
        setWalletsReady(true);
      }
    };

    loadWallet();
  }, [user]);

  return (
    <WalletLoadContext.Provider value={{ wallets, loadingWallets, walletsReady }}>
      {children}
    </WalletLoadContext.Provider>
  );
};

export const useWalletLoad = () => useContext(WalletLoadContext);
