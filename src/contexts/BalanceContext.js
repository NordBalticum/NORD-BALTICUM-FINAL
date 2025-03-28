"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useWallet } from "./WalletContext";

const BalanceContext = createContext();

export function BalanceProvider({ children }) {
  const { wallet, loadingWallet } = useWallet();

  const [balances, setBalances] = useState({});
  const [loadingBalances, setLoadingBalances] = useState(true);

  const fetchBalances = useCallback(async () => {
    if (!wallet?.id) return;

    setLoadingBalances(true);

    try {
      const { data, error } = await supabase
        .from("balances")
        .select("*")
        .eq("wallet_id", wallet.id);

      if (error) {
        console.error("❌ Failed to fetch balances:", error.message);
        return;
      }

      const parsed = {};
      for (const b of data || []) {
        parsed[b.network] = {
          amount: b.amount ?? "0.0000",
          eur: b.eur ?? "0.00",
        };
      }

      setBalances(parsed);
    } catch (err) {
      console.error("❌ Unexpected error fetching balances:", err.message);
    } finally {
      setLoadingBalances(false);
    }
  }, [wallet?.id]);

  useEffect(() => {
    if (!loadingWallet && wallet?.id) {
      fetchBalances();
    }
  }, [wallet?.id, loadingWallet, fetchBalances]);

  return (
    <BalanceContext.Provider
      value={{
        balances,
        loading: loadingBalances,
        refreshBalances: fetchBalances, // galėsi naudoti: refreshBalances()
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

export const useBalance = () => useContext(BalanceContext);
