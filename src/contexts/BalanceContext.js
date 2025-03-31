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
  const isFetchingRef = useRef(false); // apsauga nuo paralelinių kvietimų

  const updateBalances = async () => {
    if (!wallet?.list || !Array.isArray(wallet.list) || !user?.id) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const result = await fetchBalancesForAllChains(wallet.list, user.id);

      // Apskaičiuojam bendrą EUR
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
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (!wallet || !wallet.list || !user?.id) return;

    updateBalances(); // pirmas fetch
    const interval = setInterval(updateBalances, 20000); // kas 20s auto

    return () => clearInterval(interval);
  }, [wallet, user]);

  return (
    <BalanceContext.Provider
      value={{
        balances,
        isLoading,
        refreshBalances: updateBalances,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext);
