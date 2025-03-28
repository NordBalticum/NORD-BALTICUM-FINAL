"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useWallet } from "./WalletContext";

const BalanceContext = createContext();

export function BalanceProvider({ children }) {
  const { wallet, loadingWallet } = useWallet();

  const [balances, setBalances] = useState({});
  const [loadingBalances, setLoadingBalances] = useState(true);

  useEffect(() => {
    if (loadingWallet || !wallet?.id) return;

    const fetchBalances = async () => {
      setLoadingBalances(true);

      try {
        const { data, error } = await supabase
          .from("balances")
          .select("*")
          .eq("wallet_id", wallet.id);

        if (error) {
          console.error("❌ Failed to fetch balances:", error.message);
          setLoadingBalances(false);
          return;
        }

        const parsed = {};
        data?.forEach((b) => {
          parsed[b.network] = {
            amount: b.amount || "0.0000",
            eur: b.eur || "0.00",
          };
        });

        setBalances(parsed);
      } catch (err) {
        console.error("❌ Balance fetch error:", err.message);
      }

      setLoadingBalances(false);
    };

    fetchBalances();
  }, [wallet, loadingWallet]);

  return (
    <BalanceContext.Provider value={{ balances, loading: loadingBalances }}>
      {children}
    </BalanceContext.Provider>
  );
}

export const useBalance = () => useContext(BalanceContext);
