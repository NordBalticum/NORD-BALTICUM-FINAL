"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { ethers } from "ethers";
import { useMagicLink } from "@/contexts/MagicLinkContext";

const BalanceContext = createContext();

const rpcURLs = {
  BNB: "https://bsc-dataseed.binance.org/",
  TBNB: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  ETH: "https://eth.llamarpc.com",
  POL: "https://polygon-rpc.com",
  AVAX: "https://api.avax.network/ext/bc/C/rpc",
};

const priceSymbols = {
  BNB: "binancecoin",
  TBNB: "binancecoin",
  ETH: "ethereum",
  POL: "polygon",
  AVAX: "avalanche-2",
};

export const BalanceProvider = ({ children }) => {
  const { wallet } = useMagicLink();
  const [balances, setBalances] = useState({});
  const [rawBalances, setRawBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("BNB");
  const intervalRef = useRef(null);

  const fetchPrices = async () => {
    try {
      const ids = Object.values(priceSymbols).join("%2C");
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`;
      const res = await fetch(url);
      const data = await res.json();
      const prices = {};
      for (const key of Object.values(priceSymbols)) {
        prices[key] = data[key]?.eur || 0;
      }
      return prices;
    } catch (error) {
      console.error("❌ Failed to fetch prices:", error);
      return {};
    }
  };

  const fetchAllBalances = useCallback(async () => {
    if (!wallet?.address) return;

    try {
      setLoading(true);
      const prices = await fetchPrices();
      const tempBalances = {};
      const tempRaw = {};

      await Promise.all(
        Object.entries(rpcURLs).map(async ([symbol, url]) => {
          try {
            const provider = new ethers.providers.JsonRpcProvider(url);
            const balance = await provider.getBalance(wallet.address);
            const formatted = ethers.utils.formatEther(balance);
            const price = prices[priceSymbols[symbol]] || 0;
            tempRaw[symbol] = balance.toString();
            tempBalances[symbol] = {
              amount: parseFloat(formatted).toFixed(4),
              eur: (parseFloat(formatted) * price).toFixed(2),
            };
          } catch (err) {
            console.error(`❌ Balance fetch failed for ${symbol}`, err);
            tempRaw[symbol] = "0";
            tempBalances[symbol] = { amount: "0.0000", eur: "0.00" };
          }
        })
      );

      setRawBalances(tempRaw);
      setBalances(tempBalances);
    } catch (err) {
      console.error("❌ Unexpected balance error:", err);
    } finally {
      setLoading(false);
    }
  }, [wallet?.address]);

  useEffect(() => {
    if (!wallet?.address) return;

    fetchAllBalances();
    intervalRef.current = setInterval(fetchAllBalances, 6000);

    return () => clearInterval(intervalRef.current);
  }, [fetchAllBalances]);

  return (
    <BalanceContext.Provider
      value={{
        balances,
        rawBalances,
        loading,
        selectedNetwork,
        setSelectedNetwork,
        refreshBalances: fetchAllBalances,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext);
