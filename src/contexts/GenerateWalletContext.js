"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

const SUPPORTED_NETWORKS = {
  BNB: "Binance Smart Chain",
  TBNB: "BSC Testnet",
  ETH: "Ethereum",
  POL: "Polygon",
  AVAX: "Avalanche",
};

const GenerateWalletContext = createContext();

export const GenerateWalletProvider = ({ children }) => {
  const [generatedWallets, setGeneratedWallets] = useState({});
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  useEffect(() => {
    const local = localStorage.getItem("userWallets");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        setGeneratedWallets(parsed);
      } catch {
        console.error("❌ Failed to parse local wallet data");
      }
    }
  }, []);

  // ✅ Tik viena piniginė visiems tinklams
  const generateOneWalletForAllNetworks = () => {
    try {
      const wallet = ethers.Wallet.createRandom();
      const newWallets = {};
      Object.keys(SUPPORTED_NETWORKS).forEach((symbol) => {
        newWallets[symbol] = {
          address: wallet.address,
          privateKey: wallet.privateKey,
          symbol,
          network: SUPPORTED_NETWORKS[symbol],
        };
      });

      localStorage.setItem("userWallets", JSON.stringify(newWallets));
      setGeneratedWallets(newWallets);
      console.log("✅ One wallet used for all networks");
      return newWallets;
    } catch (err) {
      console.error("❌ Wallet generation error:", err.message);
      return null;
    }
  };

  return (
    <GenerateWalletContext.Provider
      value={{
        generatedWallets,
        loadingGenerate,
        generateOneWalletForAllNetworks,
      }}
    >
      {children}
    </GenerateWalletContext.Provider>
  );
};

export const useGenerateWallet = () => useContext(GenerateWalletContext);
