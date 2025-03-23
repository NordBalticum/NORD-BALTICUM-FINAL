"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { getWalletBalance } from "@/lib/ethers";

const BalanceContext = createContext();

export const BalanceProviderEthers = ({ children }) => {
  const { wallet } = useMagicLink();
  const [balance, setBalance] = useState("0.0000");
  const [rawBalance, setRawBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("bscTestnet");

  const intervalRef = useRef(null);

  // ✅ Tikra balanso fetch funkcija
  const fetchBalance = useCallback(async () => {
    if (!wallet?.address) return;

    try {
      setLoading(true);
      const { raw, formatted } = await getWalletBalance(wallet.address, selectedNetwork);
      setRawBalance(raw);
      setBalance(formatted);
    } catch (err) {
      console.error("❌ Balance fetch error in context:", err);
      setRawBalance("0");
      setBalance("0.0000");
    } finally {
      setLoading(false);
    }
  }, [wallet?.address, selectedNetwork]);

  // ✅ Automatinė sinchronizacija kas 6s
  useEffect(() => {
    if (!wallet?.address) return;

    fetchBalance(); // iškarto pirmą kartą

    intervalRef.current = setInterval(() => {
      fetchBalance();
    }, 6000);

    return () => clearInterval(intervalRef.current);
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
