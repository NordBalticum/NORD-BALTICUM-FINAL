"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext";
import { supabase } from "@/lib/supabase";
import { useMagicLink } from "./MagicLinkContext";

const BalanceContext = createContext();

export const BalanceProvider = ({ children }) => {
  const { wallet } = useWallet();
  const { user } = useMagicLink();

  const [balances, setBalances] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const networks = [
    {
      key: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      coingeckoId: "ethereum",
      rpc: [
        "https://eth.llamarpc.com",
        "https://ethereum-rpc.publicnode.com",
        "https://rpc.ankr.com/eth",
        "https://cloudflare-eth.com",
      ],
    },
    {
      key: "bsc",
      name: "BNB Chain",
      symbol: "BNB",
      coingeckoId: "binancecoin",
      rpc: [
        "https://bsc.publicnode.com",
        "https://bsc-dataseed.binance.org",
        "https://rpc.ankr.com/bsc",
        "https://1rpc.io/bnb",
      ],
    },
    {
      key: "polygon",
      name: "Polygon",
      symbol: "MATIC",
      coingeckoId: "matic-network",
      rpc: [
        "https://polygon-rpc.com",
        "https://rpc.ankr.com/polygon",
        "https://polygon.llamarpc.com",
        "https://1rpc.io/matic",
      ],
    },
    {
      key: "avalanche",
      name: "Avalanche",
      symbol: "AVAX",
      coingeckoId: "avalanche-2",
      rpc: [
        "https://api.avax.network/ext/bc/C/rpc",
        "https://rpc.ankr.com/avalanche",
        "https://1rpc.io/avax/c",
        "https://avalanche.public-rpc.com",
      ],
    },
    {
      key: "tbnb",
      name: "BNB Testnet",
      symbol: "TBNB",
      coingeckoId: null,
      rpc: [
        "https://data-seed-prebsc-1-s1.binance.org:8545/",
        "https://data-seed-prebsc-2-s1.binance.org:8545/",
        "https://endpoints.omniatech.io/v1/bsc/testnet/public",
        "https://1rpc.io/bnb-testnet",
      ],
    },
  ];

  const fetchBalance = async (rpcList, address) => {
    for (const rpc of rpcList) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(rpc);
        const balance = await provider.getBalance(address);
        return parseFloat(ethers.utils.formatEther(balance));
      } catch (err) {
        console.warn(`RPC failed: ${rpc}`);
        continue;
      }
    }
    return 0;
  };

  const fetchExchangeRates = async () => {
    const ids = networks
      .filter((net) => net.coingeckoId)
      .map((net) => net.coingeckoId)
      .join(",");

    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`);
      return await res.json();
    } catch (err) {
      console.error("❌ CoinGecko fetch error:", err.message);
      return {};
    }
  };

  const updateBalances = async () => {
    if (!wallet?.address || !user?.id) return;

    setIsLoading(true);

    const rates = await fetchExchangeRates();
    const newBalances = {};
    let totalEUR = 0;

    await Promise.all(
      networks.map(async (net) => {
        const address = wallet.address;
        if (!address) return;

        const bal = await fetchBalance(net.rpc, address);
        const eurRate = net.coingeckoId ? rates?.[net.coingeckoId]?.eur || 0 : 0;
        const eurValue = bal * eurRate;

        const formattedAmount = bal.toFixed(5);
        const formattedEUR = eurValue.toFixed(2);

        newBalances[net.symbol] = {
          symbol: net.symbol,
          network: net.key,
          balance: formattedAmount,
          eur: formattedEUR,
          address,
        };

        totalEUR += eurValue;

        await supabase.from("balances").upsert(
          [
            {
              user_id: user.id,
              wallet_address: address,
              network: net.key.toUpperCase(),
              amount: formattedAmount,
              eur: formattedEUR,
            },
          ],
          {
            onConflict: ["user_id", "wallet_address", "network"],
          }
        );
      })
    );

    newBalances.totalEUR = totalEUR.toFixed(2);
    setBalances(newBalances);
    setIsLoading(false);
  };

  useEffect(() => {
    updateBalances();
    const interval = setInterval(updateBalances, 20000);
    return () => clearInterval(interval);
  }, [wallet]);

  return (
    <BalanceContext.Provider value={{ balances, isLoading, refreshBalances: updateBalances }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext);
