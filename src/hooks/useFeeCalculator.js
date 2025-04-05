"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

// RPC adresai
const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

const BASE_GAS_LIMIT = 21000; // Basic transaction gas limit
const ADMIN_FEE_PERCENT = 3;  // 3% administracinis mokestis

export function useFeeCalculator(network, amount) {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchGasPrice = useCallback(async () => {
    try {
      if (!network) return;

      const provider = new ethers.JsonRpcProvider(RPC_URLS[network]);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits("5", "gwei"); // fallback
      const gasCost = Number(ethers.formatEther(gasPrice * BigInt(BASE_GAS_LIMIT)));

      setGasFee(gasCost);
    } catch (error) {
      console.error("❌ Gas fetch error:", error.message);
      setGasFee(0);
    }
  }, [network]);

  // Kai keičiasi tinklas arba suma, gaunam naujus duomenis
  useEffect(() => {
    fetchGasPrice();
  }, [fetchGasPrice]);

  // Kas 10 sekundžių atnaujina gas price
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGasPrice();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchGasPrice]);

  // Paskaičiuoja admin fee
  useEffect(() => {
    const adminFeeAmount = amount ? (Number(amount) * ADMIN_FEE_PERCENT) / 100 : 0;
    setAdminFee(adminFeeAmount);
  }, [amount]);

  // Total fees update
  useEffect(() => {
    setTotalFee(gasFee + adminFee);
    setLoading(false);
  }, [gasFee, adminFee]);

  return {
    gasFee,
    adminFee,
    totalFee,
    loading,
    refetchFees: fetchGasPrice, // rankinis fees atnaujinimas
  };
}
