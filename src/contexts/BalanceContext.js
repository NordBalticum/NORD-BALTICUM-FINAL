"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWallet } from "./WalletContext";
import { ethers } from "ethers";

const BalanceContext = createContext();

export const BalanceProvider = ({ children }) => {
  const { wallet } = useWallet();
  const [balances, setBalances] = useState({});

  const networks = [
    {
      key: "eth",
      name: "Ethereum",
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
      rpc: [
        "https://bsc.publicnode.com",
        "https://bsc-dataseed.binance.org",
        "https://rpc.ankr.com/bsc",
        "https://1rpc.io/bnb",
      ],
    },
    {
      key: "tbnb",
      name: "BNB Testnet",
      rpc: [
        "https://data-seed-prebsc-1-s1.binance.org:8545/",
        "https://data-seed-prebsc-2-s1.binance.org:8545/",
        "https://endpoints.omniatech.io/v1/bsc/testnet/public",
        "https://1rpc.io/bnb-testnet",
      ],
    },
    {
      key: "polygon",
      name: "Polygon",
      rpc: [
        "https://polygon-rpc.com",
        "https://rpc.ankr.com/polygon",
        "https://polygon.llamarpc.com",
        "https://1rpc.io/matic",
      ],
    },
    {
      key: "avax",
      name: "Avalanche",
      rpc: [
        "https://api.avax.network/ext/bc/C/rpc",
        "https://rpc.ankr.com/avalanche",
        "https://1rpc.io/avax/c",
        "https://avalanche.public-rpc.com",
      ],
    },
  ];

  const getEurRate = (key) => {
    switch (key) {
      case "eth":
        return 2400;
      case "bsc":
        return 550;
      case "tbnb":
        return 0;
      case "polygon":
        return 0.75;
      case "avax":
        return 38;
      default:
        return 1;
    }
  };

  const fetchBalance = async (networkKey, rpcList, address) => {
    for (const rpc of rpcList) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(rpc);
        const balance = await provider.getBalance(address);
        return parseFloat(ethers.utils.formatEther(balance));
      } catch (err) {
        continue;
      }
    }
    return 0;
  };

  const updateBalances = async () => {
    if (!wallet || !wallet.addresses) return;

    const newBalances = {};
    let totalEUR = 0;

    for (const net of networks) {
      const addr = wallet.addresses[net.key];
      if (!addr) continue;

      const bal = await fetchBalance(net.key, net.rpc, addr);
      newBalances[net.key] = bal;
      totalEUR += bal * getEurRate(net.key);
    }

    newBalances.totalEUR = totalEUR.toFixed(2);
    setBalances(newBalances);
  };

  useEffect(() => {
    updateBalances();
    const interval = setInterval(updateBalances, 15000);
    return () => clearInterval(interval);
  }, [wallet]);

  return (
    <BalanceContext.Provider value={{ balances }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext);
