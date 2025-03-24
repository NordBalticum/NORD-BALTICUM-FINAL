"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  JsonRpcProvider,
  formatEther,
} from "ethers";
import { useMagicLink } from "@/contexts/MagicLinkContext";

const BalanceContext = createContext();

// ✅ Visi RPC – 4 fallback'ai kiekvienam tinklui
const RPCS = {
  BNB: [
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com",
    "https://bsc-dataseed.binance.org",
    "https://1rpc.io/bnb",
  ],
  TBNB: [
    "https://rpc.ankr.com/bsc_testnet_chapel",
    "https://bsc-testnet.publicnode.com",
    "https://data-seed-prebsc-1-s1.binance.org:8545",
    "https://data-seed-prebsc-2-s2.binance.org:8545",
  ],
  ETH: [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://cloudflare-eth.com",
    "https://1rpc.io/eth",
  ],
  POL: [
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
    "https://1rpc.io/matic",
    "https://polygon-bor.publicnode.com",
  ],
  AVAX: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche",
    "https://avax.meowrpc.com",
    "https://avalanche-c-chain.publicnode.com",
  ],
};

// ✅ CoinGecko ID mapping
const priceSymbols = {
  BNB: "binancecoin",
  TBNB: "binancecoin",
  ETH: "ethereum",
  POL: "polygon",
  AVAX: "avalanche-2",
};

// ✅ Gauna pirmą veikiantį provider'į
const getProvider = async (symbol) => {
  const urls = RPCS[symbol] || [];
  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber();
      return provider;
    } catch (err) {
      console.warn(`⚠️ Provider failed: ${url}`);
    }
  }
  throw new Error(`❌ No working RPC provider for ${symbol}`);
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
      const ids = Object.values(priceSymbols).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`);
      const data = await res.json();
      const prices = {};
      for (const [symbol, id] of Object.entries(priceSymbols)) {
        prices[symbol] = data[id]?.eur || 0;
      }
      return prices;
    } catch (err) {
      console.error("❌ Failed to fetch prices:", err);
      return {};
    }
  };

  const fetchAllBalances = useCallback(async () => {
    if (!wallet?.address) return;
    setLoading(true);

    try {
      const prices = await fetchPrices();
      const tempBalances = {};
      const tempRaw = {};

      await Promise.all(
        Object.keys(RPCS).map(async (symbol) => {
          try {
            const provider = await getProvider(symbol);
            const raw = await provider.getBalance(wallet.address);
            const formatted = parseFloat(formatEther(raw));
            const price = prices[symbol] || 0;

            tempRaw[symbol] = raw.toString();
            tempBalances[symbol] = {
              amount: formatted.toFixed(4),
              eur: (formatted * price).toFixed(2),
            };
          } catch (err) {
            console.error(`❌ Balance error for ${symbol}:`, err);
            tempRaw[symbol] = "0";
            tempBalances[symbol] = { amount: "0.0000", eur: "0.00" };
          }
        })
      );

      setRawBalances(tempRaw);
      setBalances(tempBalances);
    } catch (err) {
      console.error("❌ Unexpected balance fetch error:", err);
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
