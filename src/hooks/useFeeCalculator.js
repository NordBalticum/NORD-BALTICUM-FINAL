"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

// ✅ RPC adresai
const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

const BASE_GAS_LIMIT = 21000;
const ADMIN_FEE_PERCENT = 3;

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
      const gasPrice = feeData.gasPrice || ethers.parseUnits("5", "gwei"); // fallback jeigu duomenų nėra
      const gasCost = Number(ethers.formatEther(gasPrice * BigInt(BASE_GAS_LIMIT)));

      setGasFee(gasCost);
    } catch (error) {
      console.error("❌ Gas fetch error:", error.message);
      setGasFee(0);
    }
  }, [network]);

  useEffect(() => {
    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 10000); // ✅ Kas 10s
    return () => clearInterval(interval);
  }, [fetchGasPrice]);

  useEffect(() => {
    if (amount) {
      const adminFeeAmount = (Number(amount) * ADMIN_FEE_PERCENT) / 100;
      setAdminFee(adminFeeAmount);
    } else {
      setAdminFee(0);
    }
  }, [amount]);

  useEffect(() => {
    setTotalFee(gasFee + adminFee);
    setLoading(false);
  }, [gasFee, adminFee]);

  return {
    gasFee,    // Real gas fee
    adminFee,  // 3% fee
    totalFee,  // Viso
    loading,
  };
}
