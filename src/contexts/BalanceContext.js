"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useWallet } from "./WalletContext";
import { useMagicLink } from "./MagicLinkContext";
import { fetchBalancesForAllChains } from "@/utils/fetchBalancesForAllChains";

const BalanceContext = createContext();

export const BalanceProvider = ({ children }) => {
  const { wallet } = useWallet();
  const { user } = useMagicLink();

  const [balances, setBalances] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false); // Apsauga nuo paralelinių fetchų

  const updateBalances = async () => {
    if (!wallet?.list || !Array.isArray(wallet.list) || !user?.id) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const result = await fetchBalancesForAllChains(wallet.list, user.id);

      const total = Object.values(result || {}).reduce((sum, b) => {
        const eur = parseFloat(b?.eur || 0);
        return sum + (isNaN(eur) ? 0 : eur);
      }, 0);

      result.totalEUR = total.toFixed(2);
      setBalances(result);
    } catch (err) {
      console.error("❌ Failed to fetch balances:", err.message);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!wallet?.list || !user?.id) return;

    updateBalances(); // Pirmas startinis fetch
    const interval = setInterval(updateBalances, 20000); // Auto refresh

    return () => clearInterval(interval);
  }, [wallet, user]);

  return (
    <BalanceContext.Provider value={{ balances, isLoading, refreshBalances: updateBalances }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext);
