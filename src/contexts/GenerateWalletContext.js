"use client";

import React, { createContext, useContext, useState } from "react";
import { ethers } from "ethers";

// Palaikomi tinklai su pavadinimais
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

  // ✅ Vienos piniginės generavimas
  const generateWalletForNetwork = (networkSymbol) => {
    try {
      const wallet = ethers.Wallet.createRandom();
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        network: SUPPORTED_NETWORKS[networkSymbol],
        symbol: networkSymbol,
      };
    } catch (err) {
      console.error(`❌ Wallet generation error (${networkSymbol}):`, err.message);
      return null;
    }
  };

  // ✅ Visų tinklų piniginių generavimas
  const generateAllWallets = () => {
    setLoadingGenerate(true);
    try {
      const newWallets = {};
      for (const symbol of Object.keys(SUPPORTED_NETWORKS)) {
        const wallet = generateWalletForNetwork(symbol);
        if (wallet) newWallets[symbol] = wallet;
      }
      setGeneratedWallets(newWallets);
      localStorage.setItem("userWallets", JSON.stringify(newWallets));
      console.log("✅ All wallets generated and saved.");
    } catch (err) {
      console.error("❌ Wallet generation failed:", err.message);
    } finally {
      setLoadingGenerate(false);
    }
  };

  // ✅ Piniginės gavimas iš localStorage
  const getStoredWallets = () => {
    try {
      const stored = localStorage.getItem("userWallets");
      if (stored) {
        const parsed = JSON.parse(stored);
        setGeneratedWallets(parsed);
        return parsed;
      }
      return null;
    } catch (err) {
      console.error("❌ Failed to load stored wallets:", err.message);
      return null;
    }
  };

  return (
    <GenerateWalletContext.Provider
      value={{
        generatedWallets,
        loadingGenerate,
        generateAllWallets,
        getStoredWallets,
      }}
    >
      {children}
    </GenerateWalletContext.Provider>
  );
};

export const useGenerateWallet = () => useContext(GenerateWalletContext);
