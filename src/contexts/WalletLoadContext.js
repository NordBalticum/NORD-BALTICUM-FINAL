// src/contexts/WalletLoadContext.js
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";

const WalletLoadContext = createContext();

export function WalletLoadProvider({ children }) {
  const { user } = useAuth();
  const [wallets, setWallets] = useState(null);
  const [loadingWallets, setLoadingWallets] = useState(true);

  useEffect(() => {
    const fetchWallets = async () => {
      if (!user) {
        setWallets(null);
        setLoadingWallets(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          console.warn("⚠️ Wallet nerastas arba klaida:", error?.message);
          setWallets(null);
        } else {
          console.log("✅ Wallet sėkmingai užkrautas:", data.address);
          setWallets(data);
        }
      } catch (err) {
        console.error("❌ Wallet fetch klaida:", err.message);
        setWallets(null);
      } finally {
        setLoadingWallets(false);
      }
    };

    fetchWallets();
  }, [user]);

  return (
    <WalletLoadContext.Provider value={{ wallets, loadingWallets }}>
      {children}
    </WalletLoadContext.Provider>
  );
}

export const useWalletLoad = () => useContext(WalletLoadContext);
