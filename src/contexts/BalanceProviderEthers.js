"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { getWalletBalance } from "@/lib/ethers";

const BalanceContext = createContext();

export const BalanceProviderEthers = ({ children }) => {
  const { wallet } = useMagicLink();

  const [balance, setBalance] = useState("0.0000");
  const [rawBalance, setRawBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState("bscTestnet");

  const fetchBalance = useCallback(async () => {
    if (!wallet?.address || !selectedNetwork) return;

    setLoading(true);
    try {
      const { raw, formatted } = await getWalletBalance(wallet.address, selectedNetwork);
      setRawBalance(raw);
      setBalance(formatted);
    } catch (err) {
      console.error("❌ Balance fetch error via getWalletBalance:", err);
      setRawBalance("0");
      setBalance("0.0000");
    } finally {
      setLoading(false);
    }
  }, [wallet?.address, selectedNetwork]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 6000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return (
    <BalanceContext.Provider
      value={{
        balance,
        rawBalance,
        loading,
        selectedNetwork,
        setSelectedNetwork,
        refreshBalance: fetchBalance,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext);
