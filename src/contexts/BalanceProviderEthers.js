"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { formatEther } from "ethers";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { getProvider } from "@/lib/ethers";

const BalanceContext = createContext();

export const BalanceProviderEthers = ({ children }) => {
  const { wallet } = useMagicLink();

  const [balance, setBalance] = useState("0.0000");
  const [rawBalance, setRawBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState("bscTestnet");

  const fetchBalance = useCallback(async () => {
    if (!wallet?.address) return;
    setLoading(true);

    try {
      const provider = await getProvider(selectedNetwork);
      const raw = await provider.getBalance(wallet.address);
      const formatted = parseFloat(formatEther(raw)).toFixed(4);

      setRawBalance(raw.toString());
      setBalance(formatted);
    } catch (err) {
      console.error("❌ Balance fetch error in context:", err);
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
