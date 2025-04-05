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

const BASE_GAS_LIMIT = 21000;
const ADMIN_FEE_PERCENT = 3;

export function useFeeCalculator(network, receiver, amount) {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchGasPrice = useCallback(async () => {
    if (!network || !receiver || !amount || !ethers.isAddress(receiver)) {
      setGasFee(0);
      return;
    }
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URLS[network]);
      const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits("5", "gwei");
      const gasCost = Number(ethers.formatEther(gasPrice * BigInt(BASE_GAS_LIMIT)));
      setGasFee(gasCost);
    } catch (error) {
      console.error("❌ Gas fetch error:", error.message);
      setGasFee(0);
    }
  }, [network, receiver, amount]);

  useEffect(() => {
    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 10000);
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
    gasFee,
    adminFee,
    totalFee,
    loading,
  };
}
