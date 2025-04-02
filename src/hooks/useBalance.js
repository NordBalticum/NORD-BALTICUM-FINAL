"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";

const NETWORKS = ["ethereum", "bsc", "polygon", "avalanche", "tbnb"];

const priceSymbols = {
  bsc: "binancecoin",
  tbnb: "binancecoin", // testnet, bet ta pati kaina
  ethereum: "ethereum",
  polygon: "matic-network",
  avalanche: "avalanche-2",
};

const fetchPrices = async () => {
  try {
    const ids = Object.values(priceSymbols).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`
    );
    const data = await res.json();

    return Object.entries(priceSymbols).reduce((acc, [net, id]) => {
      acc[net] = data?.[id]?.eur || 0;
      return acc;
    }, {});
  } catch (e) {
    console.error("❌ Price fetch failed:", e.message);
    return {};
  }
};

export const useBalance = () => {
  const { publicKey } = useWallet();
  const { user } = useMagicLink();

  const [balances, setBalances] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const isFetching = useRef(false);

  const getProvider = (network) => {
    const RPCS = {
      ethereum: "https://eth.llamarpc.com",
      bsc: "https://bsc-dataseed.binance.org",
      polygon: "https://polygon-rpc.com",
      avalanche: "https://api.avax.network/ext/bc/C/rpc",
      tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545", // BSC Testnet
    };
    return new ethers.providers.JsonRpcProvider(RPCS[network]);
  };

  const refresh = useCallback(async () => {
    if (!user?.email || !publicKey || isFetching.current) return;

    isFetching.current = true;
    setIsLoading(true);

    try {
      const prices = await fetchPrices();
      const results = {};

      await Promise.all(
        NETWORKS.map(async (network) => {
          try {
            const provider = getProvider(network);
            const balance = await provider.getBalance(publicKey);
            const formatted = ethers.utils.formatEther(balance);
            const eur = (parseFloat(formatted) * prices[network]).toFixed(2);

            results[network] = {
              amount: formatted,
              eur: isNaN(eur) ? "0.00" : eur,
            };

            await supabase.from("balances").upsert(
              [
                {
                  email: user.email,
                  network,
                  wallet_address: publicKey,
                  amount: formatted,
                  eur,
                  updated_at: new Date().toISOString(),
                },
              ],
              { onConflict: ["email", "wallet_address", "network"] }
            );
          } catch (err) {
            console.warn(`❌ Balance error [${network}]:`, err.message);
            results[network] = {
              amount: "0.00000",
              eur: "0.00",
            };
          }
        })
      );

      const total = Object.values(results).reduce((sum, b) => {
        const val = parseFloat(b.eur);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      results.totalEUR = total.toFixed(2);
      setBalances(results);
    } catch (err) {
      console.error("❌ Failed to refresh balances:", err.message);
    } finally {
      isFetching.current = false;
      setIsLoading(false);
    }
  }, [user, publicKey]);

  useEffect(() => {
    if (user?.email && publicKey) {
      refresh();
      const interval = setInterval(refresh, 30000);
      return () => clearInterval(interval);
    }
  }, [user, publicKey, refresh]);

  return { balances, isLoading, refresh };
};
