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

  // ✅ Reali balanso sinchronizacija iš blockchain
  const fetchBalance = useCallback(async () => {
    if (!wallet?.address || !selectedNetwork) return;

    setLoading(true);
    try {
      const result = await getWalletBalance(wallet.address, selectedNetwork);
      setRawBalance(result.raw);
      setBalance(result.formatted);
    } catch (err) {
      console.error("❌ Balance fetch error in context:", err);
      setRawBalance("0");
      setBalance("0.0000");
    } finally {
      setLoading(false);
    }
  }, [wallet?.address, selectedNetwork]);

  // ✅ Periodinis tikrinimas kas 6s
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
