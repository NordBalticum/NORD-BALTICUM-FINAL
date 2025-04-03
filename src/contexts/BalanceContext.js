"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

const fetchBalance = async (rpc, address) => {
  try {
    const res = await fetch(`${rpc}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [address, "latest"],
        id: 1,
      }),
    });
    const json = await res.json();
    const balance = parseInt(json.result, 16);
    return balance / 1e18;
  } catch (err) {
    console.error(`Fetch balance failed for ${address}:`, err);
    return 0;
  }
};

const fetchRates = async () => {
  try {
    const ids = Object.values(coinMap).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`;
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error("Coingecko fetch failed:", err);
    return {};
  }
};

export const BalanceProvider = ({ children }) => {
  const { wallet } = useWallet();
  const [balances, setBalances] = useState({});
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  const loadBalances = async () => {
    try {
      const result = {};
      const rateData = await fetchRates();

      for (const net of Object.keys(RPC)) {
        const address = wallet?.[net];
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

  useEffect(() => {
    if (!wallet || !wallet.bnb) return;
    loadBalances();
    const interval = setInterval(loadBalances, 30000);
    return () => clearInterval(interval);
  }, [wallet]);

  const format = (symbol) => {
    const value = balances?.[symbol] || 0;
    const coin = coinMap[symbol];
    const eurRate = parseFloat(rates?.[coin]?.eur || 0);
    const eur = (value * eurRate).toFixed(2);
    return {
      token: symbol,
      value,
      eur,
    };
  };

  const getBalance = (network) => balances?.[network] || 0;

  const getBalanceEUR = (network) => {
    const coin = coinMap[network];
    const value = getBalance(network);
    const rate = parseFloat(rates?.[coin]?.eur || 0);
    return (value * rate).toFixed(2);
  };

  const getMaxSendable = (network) => {
    const raw = getBalance(network);
    return (raw * 0.97).toFixed(6);
  };

  const refreshBalance = async (email, network) => {
    const address = wallet?.[network];
    if (!address) return;
    const bal = await fetchBalance(RPC[network], address);
    setBalances((prev) => ({ ...prev, [network]: bal }));
  };

  return (
    <BalanceContext.Provider
      value={{
        balance: getBalance,
        balanceEUR: getBalanceEUR,
        maxSendable: getMaxSendable,
        refreshBalance,
        loading,
        format,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalances = () => useContext(BalanceContext);
