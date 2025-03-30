"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWallet } from "./WalletContext";
import { ethers } from "ethers";

const BalanceContext = createContext();

export const BalanceProvider = ({ children }) => {
  const { wallet } = useWallet();
  const [balances, setBalances] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const networks = [
    {
      key: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      rpc: [
        "https://eth.llamarpc.com",
        "https://ethereum-rpc.publicnode.com",
        "https://rpc.ankr.com/eth",
        "https://cloudflare-eth.com",
      ],
      coingeckoId: "ethereum",
    },
    {
      key: "bsc",
      name: "BNB Chain",
      symbol: "BNB",
      rpc: [
        "https://bsc.publicnode.com",
        "https://bsc-dataseed.binance.org",
        "https://rpc.ankr.com/bsc",
        "https://1rpc.io/bnb",
      ],
      coingeckoId: "binancecoin",
    },
    {
      key: "polygon",
      name: "Polygon",
      symbol: "MATIC",
      rpc: [
        "https://polygon-rpc.com",
        "https://rpc.ankr.com/polygon",
        "https://polygon.llamarpc.com",
        "https://1rpc.io/matic",
      ],
      coingeckoId: "matic-network",
    },
    {
      key: "avalanche",
      name: "Avalanche",
      symbol: "AVAX",
      rpc: [
        "https://api.avax.network/ext/bc/C/rpc",
        "https://rpc.ankr.com/avalanche",
        "https://1rpc.io/avax/c",
        "https://avalanche.public-rpc.com",
      ],
      coingeckoId: "avalanche-2",
    },
    {
      key: "tbnb",
      name: "BNB Testnet",
      symbol: "tBNB",
      rpc: [
        "https://data-seed-prebsc-1-s1.binance.org:8545/",
        "https://data-seed-prebsc-2-s1.binance.org:8545/",
        "https://endpoints.omniatech.io/v1/bsc/testnet/public",
        "https://1rpc.io/bnb-testnet",
      ],
      coingeckoId: null, // No value in EUR
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

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`;

    try {
      const response = await fetch(url);
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch exchange rates:", err);
      return {};
    }
  };

  const updateBalances = async () => {
    if (!wallet || !wallet.list) return;

    setIsLoading(true);

    const exchangeRates = await fetchExchangeRates();
    const newBalances = {};
    let totalEUR = 0;

    await Promise.all(
      networks.map(async (net) => {
        const matchingWallet = wallet.list.find((w) => w.network === net.key);
        if (!matchingWallet?.address) return;

        const balance = await fetchBalance(net.rpc, matchingWallet.address);
        const eurRate = net.coingeckoId ? exchangeRates[net.coingeckoId]?.eur || 0 : 0;
        const balanceEUR = balance * eurRate;

        newBalances[net.key] = {
          address: matchingWallet.address,
          symbol: net.symbol,
          balance,
          eur: balanceEUR.toFixed(2),
        };

        totalEUR += balanceEUR;
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
