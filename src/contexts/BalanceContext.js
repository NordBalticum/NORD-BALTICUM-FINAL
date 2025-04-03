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
    console.error(`Fetch balance failed for ${address}:`, err);
    return 0;
  }
};

const fetchRates = async () => {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(coinMap).join(",")}&vs_currencies=eur,usd`;
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error("Coingecko fetch failed:", err);
    return {};
  }
};

export const BalanceProvider = ({ children }) => {
  const { wallet } = useWallet();
  const [balances, setBalances] = useState(null);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !wallet || !wallet.bnb) return;

    const loadBalances = async () => {
      try {
        const result = {};
        const rateData = await fetchRates();

        for (const net of Object.keys(RPC)) {
          const address = wallet[net];
          if (address) {
            const balance = await fetchBalance(RPC[net], address);
            result[net] = balance;
          }
        }

        setBalances(result);
        setRates(rateData);
      } catch (err) {
        console.error("Balance fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBalances();
    const interval = setInterval(loadBalances, 30000);
    return () => clearInterval(interval);
  }, [wallet, isClient]);

  const format = (symbol, value) => {
    const coin = coinMap[symbol];
    const eurRate = parseFloat(rates?.[coin]?.eur || 0);
    const usdRate = parseFloat(rates?.[coin]?.usd || 0);

    return {
      token: symbol,
      value: parseFloat(value || 0),
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
