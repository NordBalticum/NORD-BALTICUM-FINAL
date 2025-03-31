"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWallet } from "./WalletContext";
import { useMagicLink } from "./MagicLinkContext";
import { fetchBalancesForAllChains } from "@/utils/fetchBalancesForAllChains";

const BalanceContext = createContext();

export const BalanceProvider = ({ children }) => {
  const { wallet } = useWallet();
  const { user } = useMagicLink();

  const [balances, setBalances] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const updateBalances = async () => {
    if (!wallet?.list || !user?.id) return;

    setIsLoading(true);

    try {
      const result = await fetchBalancesForAllChains(wallet.list, user.id);

      // Pridedam totalEUR automatiškai
      const total = Object.values(result || {}).reduce((sum, b) => {
        const eur = parseFloat(b?.eur || 0);
        return sum + (isNaN(eur) ? 0 : eur);
      }, 0);

      result.totalEUR = total.toFixed(2);
      setBalances(result);
    } catch (err) {
      console.error("❌ Failed to update balances:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updateBalances();
    const interval = setInterval(updateBalances, 20000); // kas 20s
    return () => clearInterval(interval);
  }, [wallet]);

  return (
    <BalanceContext.Provider value={{ balances, isLoading, refreshBalances: updateBalances }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext);
