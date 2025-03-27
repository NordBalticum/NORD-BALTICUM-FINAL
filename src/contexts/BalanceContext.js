"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { JsonRpcProvider, formatEther } from "ethers";
import { useWalletLoad } from "@/contexts/WalletLoadContext";

const BalanceContext = createContext();

// === RPC fallback'ai
const RPCS = {
  BNB: [
    "https://rpc.ankr.com/bsc",
    "https://bsc-dataseed.binance.org",
    "https://bsc.publicnode.com",
    "https://1rpc.io/bnb",
  ],
  TBNB: [
    "https://rpc.ankr.com/bsc_testnet_chapel",
    "https://data-seed-prebsc-1-s1.binance.org:8545",
    "https://data-seed-prebsc-2-s2.binance.org:8545",
    "https://bsc-testnet.publicnode.com",
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
    "https://polygon-bor.publicnode.com",
    "https://1rpc.io/matic",
  ],
  AVAX: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche",
    "https://avax.meowrpc.com",
    "https://avalanche-c-chain.publicnode.com",
  ],
};

// === CoinGecko simboliai
const COINGECKO_IDS = {
  BNB: "binancecoin",
  TBNB: "binancecoin",
  ETH: "ethereum",
  POL: "polygon",
  AVAX: "avalanche-2",
};

// === Saugus toFixed
const toFixedSafe = (num, digits = 4) => {
  if (isNaN(num)) return "0.0000";
  return parseFloat(num).toFixed(digits);
};

// === Gauk gyvą providerį
const getWorkingProvider = async (symbol) => {
  const urls = RPCS[symbol] || [];
  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber();
      return provider;
    } catch {
      continue;
    }
  }
  throw new Error(`No working RPC for ${symbol}`);
};

// === Balance Provider
export const BalanceProvider = ({ children }) => {
  const { wallets } = useWalletLoad();
  const [balances, setBalances] = useState({});
  const [rawBalances, setRawBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("BNB");
  const intervalRef = useRef(null);

  const fetchPrices = async () => {
    try {
      const ids = Object.values(COINGECKO_IDS).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`);
      const data = await res.json();
      const prices = {};
      for (const [symbol, id] of Object.entries(COINGECKO_IDS)) {
        prices[symbol] = data[id]?.eur || 0;
      }
      return prices;
    } catch (err) {
      console.error("❌ Failed to fetch prices:", err);
      return {};
    }
  };

  const fetchAllBalances = useCallback(async () => {
    if (!wallets?.address) return;
    setLoading(true);

    try {
      const prices = await fetchPrices();
      const tempBalances = {};
      const tempRaw = {};

      await Promise.all(
        Object.keys(RPCS).map(async (symbol) => {
          try {
            const provider = await getWorkingProvider(symbol);
            const balance = await provider.getBalance(wallets.address);
            const float = parseFloat(formatEther(balance));
            const eur = (float * (prices[symbol] || 0)).toFixed(2);

            tempBalances[symbol] = {
              amount: toFixedSafe(float),
              eur,
            };

            tempRaw[symbol] = balance.toString();
          } catch (err) {
            console.warn(`⚠️ ${symbol} balance error:`, err);
            tempBalances[symbol] = { amount: "0.0000", eur: "0.00" };
            tempRaw[symbol] = "0";
          }
        })
      );

      setBalances(tempBalances);
      setRawBalances(tempRaw);
    } catch (err) {
      console.error("❌ Total balance fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [wallets?.address]);

  // === Automatinis intervalas
  useEffect(() => {
    if (!wallets?.address) return;

    fetchAllBalances(); // Initial
    intervalRef.current = setInterval(fetchAllBalances, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
