"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { JsonRpcProvider, formatEther } from "ethers";
import { useAuth } from "@/contexts/AuthContext";

export const BalanceContext = createContext();

const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

const coinMap = {
  eth: "ethereum",
  bnb: "binancecoin",
  tbnb: "binancecoin",
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
    console.error("Failed fetching CoinGecko rates:", err);
    return {};
  }
};

const fetchBalance = async (rpcUrl, address) => {
  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    return parseFloat(formatEther(balance));
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error);
    return 0;
  }
};

export const BalanceProvider = ({ children }) => {
  const { wallet } = useAuth();
  const [balances, setBalances] = useState({});
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  const loadBalances = useCallback(async () => {
    if (!isClient || !wallet || !wallet.signers) return;

    setLoading(true);
    try {
      const addresses = Object.entries(wallet.signers).reduce((acc, [network, signer]) => {
        if (signer?.address) acc[network] = signer.address;
        return acc;
      }, {});

      const rateData = await fetchRates();

      const balancePromises = Object.keys(addresses).map(async (network) => {
        const address = addresses[network];
        const balance = await fetchBalance(RPC[network], address);
        return { network, balance };
      });

      const results = await Promise.all(balancePromises);

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
  }, [wallet, isClient]);

  useEffect(() => {
    if (!isClient || !wallet || !wallet.signers) return;
    loadBalances();
    const interval = setInterval(loadBalances, 30000);
    return () => clearInterval(interval);
  }, [wallet, loadBalances, isClient]);

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

  const refreshBalance = async (network) => {
    if (!isClient || !wallet || !wallet.signers) return;
    const address = wallet.signers[network]?.address;
    if (!address) return;

    try {
      const balance = await fetchBalance(RPC[network], address);
      setBalances((prev) => ({
        ...prev,
        [network]: balance,
      }));
    } catch (error) {
      console.error(`Error refreshing balance for ${network}:`, error);
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
