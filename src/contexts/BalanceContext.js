"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
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

const fetchBalance = async (rpcUrl, address) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl, { timeout: 10000 });
    const balance = await provider.getBalance(address);
    return parseFloat(ethers.utils.formatEther(balance));
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error);
    return 0;
  }
};

export const BalanceProvider = ({ children }) => {
  const { wallet } = useWallet();
  const [balances, setBalances] = useState({});
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  const loadBalances = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    try {
      const rateData = await fetchRates();

      const promises = Object.keys(RPC).map(async (network) => {
        const address = wallet?.[network];
        if (!address) return { network, balance: 0 };

        const balance = await fetchBalance(RPC[network], address);
        return { network, balance };
      });

      const results = await Promise.all(promises);

      const balancesResult = {};
      results.forEach(({ network, balance }) => {
        balancesResult[network] = balance;
      });

      setBalances(balancesResult);
      setRates(rateData);
    } catch (error) {
      console.error("Error loading balances:", error);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (!wallet || !wallet.bnb) return;
    loadBalances();
    const interval = setInterval(loadBalances, 30000);
    return () => clearInterval(interval);
  }, [wallet, loadBalances]);

  const getBalance = (network) => balances?.[network] || 0;

  const getBalanceEUR = (network) => {
    const coin = coinMap[network];
    const balance = getBalance(network);
    const eurRate = parseFloat(rates?.[coin]?.eur || 0);
    return balance * eurRate;
  };

  const getMaxSendable = (network) => {
    const raw = getBalance(network);
    return raw * 0.97;
  };

  const refreshBalance = async (email, network) => {
    if (!wallet || !network) return;
    const address = wallet?.[network];
    if (!address) return;

    try {
      const balance = await fetchBalance(RPC[network], address);
      setBalances((prev) => ({
        ...prev,
        [network]: balance,
      }));
    } catch (error) {
      console.error(`Refresh balance error for ${network}:`, error);
    }
  };

  return (
    <BalanceContext.Provider
      value={{
        balance: getBalance,
        balanceEUR: getBalanceEUR,
        maxSendable: getMaxSendable,
        refreshBalance,
        loading,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalances = () => useContext(BalanceContext);
