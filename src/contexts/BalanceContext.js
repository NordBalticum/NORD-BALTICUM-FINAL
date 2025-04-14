"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ethers } from "ethers";

const BalanceContext = createContext();
export const useBalance = () => useContext(BalanceContext);

// ✅ RPC tinklai
export const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

// ✅ CoinGecko ID mapping
export const TOKEN_IDS = {
  eth: "ethereum",
  bnb: "binancecoin",
  tbnb: "binancecoin",
  matic: "polygon",
  avax: "avalanche-2",
};

// ✅ Fallback kainos
const FALLBACK_PRICES = {
  eth: { eur: 2900, usd: 3100 },
  bnb: { eur: 450, usd: 480 },
  tbnb: { eur: 450, usd: 480 },
  matic: { eur: 1.5, usd: 1.6 },
  avax: { eur: 30, usd: 32 },
};

export const BalanceProvider = ({ children }) => {
  const { wallet, authLoading, walletLoading } = useAuth();

  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);

  const intervalRef = useRef(null);

  // ✅ Balanso ir kainų užkrovimas
  const fetchBalancesAndPrices = useCallback(async () => {
    if (!wallet) return;

    try {
      const newBalances = {};

      // ✅ Jeigu turim signer'ius (full Web3 wallet)
      if (wallet.signers) {
        await Promise.all(Object.entries(wallet.signers).map(async ([network, signer]) => {
          try {
            const balance = await signer.getBalance();
            newBalances[network] = parseFloat(ethers.formatEther(balance));
          } catch (error) {
            console.error(`❌ Balance error for ${network}:`, error.message);
            newBalances[network] = 0;
          }
        }));
      } else if (wallet.wallet?.address) {
        // ✅ Jeigu turim tik adresą (be signer'io)
        const address = wallet.wallet.address;
        await Promise.all(Object.entries(RPC).map(async ([network, rpcUrl]) => {
          try {
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            const balance = await provider.getBalance(address);
            newBalances[network] = parseFloat(ethers.formatEther(balance));
          } catch (error) {
            console.error(`❌ Balance fetch error [${network}]:`, error.message);
            newBalances[network] = 0;
          }
        }));
      }

      setBalances(newBalances);

      // ✅ Užkraunam CoinGecko kainas
      const ids = Array.from(new Set(Object.values(TOKEN_IDS))).join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`, {
        cache: "no-store",
      });

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
    } catch (error) {
      console.error("❌ fetchBalancesAndPrices error:", error.message);
      setPrices(FALLBACK_PRICES);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (authLoading || walletLoading) return;
    if (!wallet) return;

    setLoading(true);
    fetchBalancesAndPrices();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchBalancesAndPrices, 30000); // ✅ Kas 30s auto refresh

    return () => clearInterval(intervalRef.current);
  }, [authLoading, walletLoading, wallet, fetchBalancesAndPrices]);

  return (
    <BalanceContext.Provider value={{
      balances,
      prices,
      loading,
      refetch: fetchBalancesAndPrices,
    }}>
      {children}
    </BalanceContext.Provider>
  );
};
