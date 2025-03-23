"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { JsonRpcProvider, formatEther } from "ethers";
import { useMagicLink } from "@/contexts/MagicLinkContext";

const BalanceContext = createContext();

const RPC_URLS = {
  bsc: [
    process.env.NEXT_PUBLIC_BSC_RPC,
    "https://bsc-dataseed.binance.org",
    "https://bsc.publicnode.com"
  ],
  bscTestnet: [
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
    "https://data-seed-prebsc-1-s1.binance.org:8545",
    "https://bsc-testnet.publicnode.com"
  ],
};

const getProviderWithFallback = (network = "bsc") => {
  const urls = RPC_URLS[network] || [];
  for (let url of urls) {
    if (url) return new JsonRpcProvider(url);
  }
  return null;
};

export const BalanceProvider = ({ children }) => {
  const { wallet } = useMagicLink();
  const [selectedNetwork, setSelectedNetwork] = useState("bscTestnet");
  const [balance, setBalance] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!wallet?.address || !selectedNetwork) return;

    setLoading(true);

    try {
      const provider = getProviderWithFallback(selectedNetwork);
      if (!provider) throw new Error("No valid RPC provider found");
      const raw = await provider.getBalance(wallet.address);
      const formatted = parseFloat(formatEther(raw)).toFixed(4);
      setBalance(formatted);
    } catch (err) {
      console.error("❌ Balance fetch error:", err);
      setBalance("Error");
    } finally {
      setLoading(false);
    }
  }, [wallet?.address, selectedNetwork]);

  useEffect(() => {
    fetchBalance(); // pirma užkrova
    const interval = setInterval(fetchBalance, 6000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return (
    <BalanceContext.Provider value={{
      balance,
      loading,
      selectedNetwork,
      setSelectedNetwork,
      refreshBalance: fetchBalance
    }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext);
