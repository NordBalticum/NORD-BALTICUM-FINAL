"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";

// ✅ Konteksto inicializavimas
const BalanceContext = createContext();

// ✅ BalanceProvider – naudoja realų Supabase duomenų šaltinį
export const BalanceProvider = ({ children }) => {
  const { user, wallet, supabase } = useMagicLink();
  const [selectedNetwork, setSelectedNetwork] = useState("bscTestnet");
  const [balance, setBalance] = useState("0.0000");
  const [rawBalance, setRawBalance] = useState("0");
  const [loading, setLoading] = useState(true);

  // ✅ Gauna balansą iš Supabase duomenų bazės
  const fetchBalance = useCallback(async () => {
    if (!user?.id || !selectedNetwork) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("balances")
        .select("balance_formatted, balance_raw")
        .eq("user_id", user.id)
        .eq("network", selectedNetwork)
        .single();

      if (error || !data) {
        setBalance("0.0000");
        setRawBalance("0");
      } else {
        setBalance(data.balance_formatted || "0.0000");
        setRawBalance(data.balance_raw || "0");
      }
    } catch (err) {
      console.error("❌ Supabase balance fetch failed:", err);
      setBalance("0.0000");
      setRawBalance("0");
    } finally {
      setLoading(false);
    }
  }, [supabase, user?.id, selectedNetwork]);

  // ✅ Automatinis užkrovimas ir atnaujinimas kas 6 sek.
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

// ✅ Hookas naudoti komponentuose
export const useBalance = () => useContext(BalanceContext);
