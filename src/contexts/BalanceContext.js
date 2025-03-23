// contexts/BalanceContext.js
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getWalletBalance } from "@/lib/ethers";
import { useMagicLink } from "@/contexts/MagicLinkContext";

const BalanceContext = createContext();

export const BalanceProvider = ({ children }) => {
  const { wallet } = useMagicLink();
  const [balance, setBalance] = useState("0.0000");
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState("bscTestnet");

  const fetchBalance = useCallback(async () => {
    if (wallet?.address) {
      try {
        setLoading(true);
        const result = await getWalletBalance(wallet.address, network);
        setBalance(result);
      } catch (err) {
        console.error("Global balance error:", err);
        setBalance("0.0000");
      } finally {
        setLoading(false);
      }
    }
  }, [wallet, network]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 6000); // auto-refresh
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return (
    <BalanceContext.Provider value={{ balance, loading, network, setNetwork, refreshBalance: fetchBalance }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext);
