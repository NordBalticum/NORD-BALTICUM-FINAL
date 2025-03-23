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

// ✅ Patikimi RPC su fallback
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

// ✅ Grąžina veikiantį provider
const getProviderWithFallback = (network = "bsc") => {
  const urls = RPC_URLS[network] || [];
  for (let url of urls) {
    if (url) return new JsonRpcProvider(url);
  }
  return null;
};

// ✅ BalanceProvider – veikia visoje sistemoje
export const BalanceProvider = ({ children }) => {
  const { wallet } = useMagicLink();
  const [selectedNetwork, setSelectedNetwork] = useState("bscTestnet");
  const [balance, setBalance] = useState("0.0000");
  const [rawBalance, setRawBalance] = useState("0");
  const [loading, setLoading] = useState(true);

  // ✅ Balanso užkrovimo funkcija
  const fetchBalance = useCallback(async () => {
    if (!wallet?.address || !selectedNetwork) return;
    setLoading(true);

    try {
      const provider = getProviderWithFallback(selectedNetwork);
      if (!provider) throw new Error("No valid RPC provider");

      const raw = await provider.getBalance(wallet.address);
      const formatted = parseFloat(formatEther(raw)).toFixed(4);

      setRawBalance(raw.toString());
      setBalance(formatted);
    } catch (err) {
      console.error("❌ Balance fetch error:", err);
      setBalance("0.0000");
      setRawBalance("0");
    } finally {
      setLoading(false);
    }
  }, [wallet?.address, selectedNetwork]);

  // ✅ Automatinis atnaujinimas kas 6 sek
  useEffect(() => {
    fetchBalance(); // pirmas užkrovimas
    const interval = setInterval(fetchBalance, 6000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return (
    <BalanceContext.Provider
      value={{
        balance,        // formatuotas, pvz. 0.0043
        rawBalance,     // raw string, pvz. "4312673987123"
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

// ✅ Hookas – naudoti komponente: const { balance } = useBalance();
export const useBalance = () => useContext(BalanceContext);
