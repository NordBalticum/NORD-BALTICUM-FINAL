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

// ✅ Balance kontekstas
const BalanceContext = createContext();

// ✅ Patikimi RPC URL'ai su fallback'ais
const RPC_URLS = {
  bsc: [
    process.env.NEXT_PUBLIC_BSC_RPC,
    "https://bsc-dataseed.binance.org",
    "https://bsc.publicnode.com",
  ],
  bscTestnet: [
    process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
    "https://data-seed-prebsc-1-s1.binance.org:8545",
    "https://bsc-testnet.publicnode.com",
  ],
};

// ✅ Funkcija grąžinanti pirmą galimą veikiančią provider instanciją
const getProviderWithFallback = (network = "bsc") => {
  const urls = RPC_URLS[network] || [];
  for (let url of urls) {
    if (url) return new JsonRpcProvider(url);
  }
  return null;
};

// ✅ Pagrindinis Balance Provider
export const BalanceProvider = ({ children }) => {
  const { wallet } = useMagicLink();
  const [selectedNetwork, setSelectedNetwork] = useState("bscTestnet");
  const [balance, setBalance] = useState("0.0000");
  const [rawBalance, setRawBalance] = useState("0");
  const [loading, setLoading] = useState(true);

  // ✅ Balanso užkrovimas pagal piniginę ir tinklą
  const fetchBalance = useCallback(async () => {
    if (!wallet?.address || !selectedNetwork) return;
    setLoading(true);

    try {
      const provider = getProviderWithFallback(selectedNetwork);
      if (!provider) throw new Error("No valid RPC provider");

      const raw = await provider.getBalance(wallet.address); // BigInt
      const formatted = parseFloat(formatEther(raw)).toFixed(4);

      setRawBalance(raw.toString());
      setBalance(formatted);
    } catch (err) {
      console.error("❌ Balance fetch error:", err);
      setRawBalance("0");
      setBalance("0.0000");
    } finally {
      setLoading(false);
    }
  }, [wallet?.address, selectedNetwork]);

  // ✅ Pirmas įkrovimas ir interval atnaujinimui
  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 6000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return (
    <BalanceContext.Provider
      value={{
        balance,            // pvz. "0.0153"
        rawBalance,         // pvz. "15300000000000000"
        loading,
        selectedNetwork,    // bsc arba bscTestnet
        setSelectedNetwork, // keisti iš UI
        refreshBalance: fetchBalance,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
};

// ✅ Hookas: naudok bet kur projekte
export const useBalance = () => useContext(BalanceContext);
