"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { JsonRpcProvider, formatEther, isAddress } from "ethers";
import { useWallet } from "@/contexts/WalletContext";

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

// Fetch rates from CoinGecko
const fetchRates = async () => {
  try {
    const ids = Object.values(coinMap).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch rates");
    return await res.json();
  } catch (err) {
    console.error("Rates fetch error:", err);
    return {};
  }
};

// Fetch single wallet balance
const fetchBalance = async (rpcUrl, address) => {
  try {
    if (!address || !isAddress(address)) return 0;
    const provider = new JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);
    return parseFloat(formatEther(balance));
  } catch (err) {
    console.error(`Fetch balance error for ${address}:`, err);
    return 0;
  }
};

export const BalanceProvider = ({ children }) => {
  const { wallet } = useWallet();
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
    if (!wallet || !wallet.signers || !isClient) return;

    setLoading(true);

    try {
      const addresses = Object.keys(wallet.signers).reduce((acc, network) => {
        const addr = wallet.signers[network]?.address;
        if (addr && isAddress(addr)) {
          acc[network] = addr;
        }
        return acc;
      }, {});

      const rateDataPromise = fetchRates();
      const balancePromises = Object.entries(addresses).map(
        async ([network, address]) => {
          const balance = await fetchBalance(RPC[network], address);
          return { network, balance };
        }
      );

      const [rateData, balancesData] = await Promise.all([
        rateDataPromise,
        Promise.all(balancePromises),
      ]);

      const balancesObj = {};
      balancesData.forEach(({ network, balance }) => {
        balancesObj[network] = balance;
      });

      setBalances(balancesObj);
      setRates(rateData);
    } catch (err) {
      console.error("Error loading balances:", err);
    } finally {
      setLoading(false);
    }
  }, [wallet, isClient]);

  useEffect(() => {
    if (!wallet || !wallet.signers || !isClient) return;

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
    const rawBalance = getBalance(network);
    return rawBalance * 0.97;
  };

  const refreshBalance = async (_email, network) => {
    if (!wallet || !wallet.signers || !isClient || !network) return;

    const address = wallet.signers[network]?.address;
    if (!address || !isAddress(address)) return;

    try {
      const balance = await fetchBalance(RPC[network], address);
      setBalances((prev) => ({
        ...prev,
        [network]: balance,
      }));
    } catch (err) {
      console.error(`Refresh balance error for ${network}:`, err);
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
