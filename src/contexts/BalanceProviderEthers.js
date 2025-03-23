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

const RPCS = {
  bsc: [
    process.env.NEXT_PUBLIC_BSC_RPC_1,
    process.env.NEXT_PUBLIC_BSC_RPC_2,
    "https://bsc-dataseed.binance.org",
  ],
  bscTestnet: [
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_1,
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_2,
    "https://data-seed-prebsc-1-s1.binance.org:8545",
  ],
};

const getProvider = (network = "bsc") => {
  const urls = RPCS[network] || [];
  for (const url of urls) {
    if (url) return new JsonRpcProvider(url);
  }
  return null;
};

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
      const provider = getProvider(selectedNetwork);
      if (!provider) throw new Error("No RPC Provider");

      const raw = await provider.getBalance(wallet.address);
      const formatted = parseFloat(formatEther(raw)).toFixed(4);

      setRawBalance(raw.toString());
      setBalance(formatted);
    } catch (err) {
      console.error("❌ Ethers balance error:", err);
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
