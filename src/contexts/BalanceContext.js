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

const fetchBalance = async (providerUrl, address) => {
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const balance = await provider.getBalance(address);
  return parseFloat(ethers.utils.formatEther(balance));
};

const fetchRates = async () => {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,binancecoin,polygon,avalanche-2&vs_currencies=eur,usd";
  const res = await fetch(url);
  return await res.json();
};

export const BalanceProvider = ({ children }) => {
  const { wallet } = useWallet();
  const [balances, setBalances] = useState(null);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet) return;

    const loadBalances = async () => {
      try {
        const result = {};
        const networks = Object.keys(RPC);

        for (const net of networks) {
          const address = wallet[net];
          if (address) {
            result[net] = await fetchBalance(RPC[net], address);
          }
        }

        const rateData = await fetchRates();
        setBalances(result);
        setRates(rateData);
      } catch (err) {
        console.error("Balance fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBalances();
  }, [wallet]);

  const format = (symbol, value) => {
    const coinMap = {
      bnb: "binancecoin",
      tbnb: "binancecoin",
      eth: "ethereum",
      matic: "polygon",
      avax: "avalanche-2",
    };

    const coin = coinMap[symbol];
    const eurRate = rates?.[coin]?.eur || 0;
    const usdRate = rates?.[coin]?.usd || 0;

    return {
      token: symbol,
      value,
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
