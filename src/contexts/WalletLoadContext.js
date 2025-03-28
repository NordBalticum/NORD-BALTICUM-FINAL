"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useMagicLink } from "./MagicLinkContext";

const WalletLoadContext = createContext();

// Supabase klientas
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
      if (!user?.email) return setLoadingWallets(false);

      setLoadingWallets(true);

      try {
        // 1. Tikrinam localStorage cache
        const cached = localStorage.getItem("userWallets");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setWallets(parsed);
            setLoadingWallets(false);
            return;
          } catch (err) {
            console.warn("⚠️ Netinkamas localStorage formatas, trinu...");
            localStorage.removeItem("userWallets");
          }
        }

        // 2. Gaunam iš Supabase DB
        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .eq("email", user.email)
          .single();

        if (error || !data) {
          console.warn("⚠️ Piniginė nerasta Supabase DB.");
          setWallets(null);
          setLoadingWallets(false);
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
        console.error("❌ Klaida kraunant piniginę:", err.message);
        setWallets(null);
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
