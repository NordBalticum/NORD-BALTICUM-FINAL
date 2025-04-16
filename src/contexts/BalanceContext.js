"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { ethers } from "ethers";
import debounce from "lodash.debounce";

export const RPC = {
  eth: {
    urls: [
      "https://rpc.ankr.com/eth", // primary: Ankr
      "https://eth.llamarpc.com", // fallback: LlamaNodes (nemokamas, be API)
    ],
    chainId: 1,
    name: "eth",
  },
  bnb: {
    urls: [
      "https://bsc-dataseed.binance.org/", // primary
      "https://bsc.publicnode.com", // fallback
    ],
    chainId: 56,
    name: "bnb",
  },
  tbnb: {
    urls: [
      "https://data-seed-prebsc-1-s1.binance.org:8545/", // primary
      "https://endpoints.omniatech.io/v1/bsc/testnet/public", // fallback
    ],
    chainId: 97,
    name: "tbnb",
  },
  matic: {
    urls: [
      "https://rpc.ankr.com/polygon", // primary
      "https://polygon.llamarpc.com", // fallback
    ],
    chainId: 137,
    name: "matic",
  },
  avax: {
    urls: [
      "https://rpc.ankr.com/avalanche", // primary
      "https://avalanche.public-rpc.com", // fallback
    ],
    chainId: 43114,
    name: "avax",
  },
};

export const TOKEN_IDS = {
  eth: "ethereum",
  bnb: "binancecoin",
  tbnb: "binancecoin",
  matic: "polygon",
  avax: "avalanche-2",
};

const FALLBACK_PRICES = {
  eth: { eur: 2900, usd: 3100 },
  bnb: { eur: 450, usd: 480 },
  tbnb: { eur: 450, usd: 480 },
  matic: { eur: 1.5, usd: 1.6 },
  avax: { eur: 30, usd: 32 },
};

const BALANCE_KEY = "nordbalticum_balances";
const PRICE_KEY = "nordbalticum_prices";

const BalanceContext = createContext();
export const useBalance = () => useContext(BalanceContext);

export const BalanceProvider = ({ children }) => {
  const { wallet, authLoading, walletLoading } = useAuth();
  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);

  const intervalRef = useRef(null);
  const lastKnownBalances = useRef({});

  const saveToLocal = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  const loadFromLocal = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const fetchBalancesAndPrices = useCallback(async () => {
  if (!wallet?.wallet?.address) return;

  try {
    setLoading(true);
    const address = wallet.wallet.address;
    const newBalances = {};

    for (const network of Object.keys(RPC)) {
      try {
        const fallbackProvider = new ethers.FallbackProvider(
          RPC[network].urls.map(
            (url) =>
              new ethers.JsonRpcProvider(url, {
                chainId: RPC[network].chainId,
                name: RPC[network].name,
              })
          )
        );

        const balance = await fallbackProvider.getBalance(address);
        newBalances[network] = parseFloat(ethers.formatEther(balance));
      } catch (err) {
        console.warn(`❌ Failed to fetch balance for ${network}:`, err?.message);
      }
    }

    setBalances(newBalances);
    saveToLocal(BALANCE_KEY, newBalances);
    lastKnownBalances.current = newBalances;

    const ids = Array.from(new Set(Object.values(TOKEN_IDS))).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error("Failed to fetch prices from CoinGecko");

    const data = await res.json();
    const newPrices = {};

    for (const [symbol, id] of Object.entries(TOKEN_IDS)) {
      newPrices[symbol] = {
        eur: data[id]?.eur ?? FALLBACK_PRICES[symbol].eur,
        usd: data[id]?.usd ?? FALLBACK_PRICES[symbol].usd,
      };
    }

    setPrices(newPrices);
    saveToLocal(PRICE_KEY, newPrices);
  } catch (error) {
    console.error("❌ Critical error in fetchBalancesAndPrices:", error.message);
  } finally {
    setLoading(false);
  }
}, [wallet]);

  useEffect(() => {
    const cachedBalances = loadFromLocal(BALANCE_KEY);
    const cachedPrices = loadFromLocal(PRICE_KEY);
    if (cachedBalances) setBalances(cachedBalances);
    if (cachedPrices) setPrices(cachedPrices);
    lastKnownBalances.current = cachedBalances || {};
  }, []);

  useEffect(() => {
    if (authLoading || walletLoading || !wallet?.wallet?.address) return;
    fetchBalancesAndPrices();
  }, [authLoading, walletLoading, wallet, fetchBalancesAndPrices]);

  useEffect(() => {
    if (!wallet?.wallet?.address) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchBalancesAndPrices();
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [wallet, fetchBalancesAndPrices]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVisibilityChange = debounce(async () => {
      if (document.visibilityState === "visible") {
        console.log("🔁 Tab visible – refreshing balances...");
        await fetchBalancesAndPrices();
      }
    }, 500);

    const handleOnline = debounce(async () => {
      console.log("🔁 Network online – refreshing balances...");
      await fetchBalancesAndPrices();
    }, 500);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [fetchBalancesAndPrices]);

  return (
    <BalanceContext.Provider
      value={{
        balances,
        prices,
        loading,
        refetch: fetchBalancesAndPrices,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
};
