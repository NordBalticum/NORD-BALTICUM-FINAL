"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/contexts/WalletContext";

export const BalanceContext = createContext();

const RPC = {
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  eth: "https://rpc.ankr.com/eth",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

const coinMap = {
  bnb: "binancecoin",
  tbnb: "binancecoin",
  eth: "ethereum",
  matic: "polygon",
  avax: "avalanche-2",
};

const fetchBalance = async (providerUrl, address) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const balance = await provider.getBalance(address);
    return parseFloat(ethers.utils.formatEther(balance));
  } catch (err) {
    console.error(`❌ Balance fetch failed (${address}):`, err);
    return 0;
  }
};

const fetchRates = async () => {
  try {
    const ids = Object.values(coinMap).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Rate limit or fetch error");
    return await res.json();
  } catch (err) {
    console.error("❌ Coingecko error:", err);
    return {}; // prevent crash in case of failure
  }
};

export const BalanceProvider = ({ children }) => {
  const { wallet } = useWallet();
  const [balances, setBalances] = useState(null);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wallet || !wallet.bnb) return;

    const load = async () => {
      setLoading(true);
      try {
        const newBalances = {};
        const currentRates = await fetchRates();

        for (const net of Object.keys(RPC)) {
          const addr = wallet[net];
          if (addr) {
            const amount = await fetchBalance(RPC[net], addr);
            newBalances[net] = amount;
          }
        }

        setBalances(newBalances);
        setRates(currentRates);
      } catch (err) {
        console.error("❌ loadBalances error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [wallet]);

  const format = (symbol, value) => {
    const coin = coinMap[symbol];
    const eurRate = parseFloat(rates?.[coin]?.eur || 0);
    const usdRate = parseFloat(rates?.[coin]?.usd || 0);

    return {
      token: symbol,
      value: parseFloat(value),
      eur: parseFloat((value * eurRate).toFixed(2)),
      usd: parseFloat((value * usdRate).toFixed(2)),
    };
  };

  return (
    <BalanceContext.Provider value={{ balances, format, loading }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalances = () => useContext(BalanceContext);
