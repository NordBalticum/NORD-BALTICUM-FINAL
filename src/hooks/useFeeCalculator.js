"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";

const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

const BASE_GAS_LIMIT = 21000n; // Basic gas limit
const ADMIN_FEE_PERCENT = 3; // 3% admin mokestis

export function useFeeCalculator(network, amount = 0, speed = "average") {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchGasFee = useCallback(async () => {
    if (!network) return;

    try {
      const rpcUrl = RPC_URLS[network];
      if (!rpcUrl) throw new Error("Unsupported network");

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const feeData = await provider.getFeeData();
      let gasPrice = feeData.gasPrice || ethers.parseUnits("5", "gwei");

      if (speed === "slow") {
        gasPrice = gasPrice * 8n / 10n; // -20%
      } else if (speed === "fast") {
        gasPrice = gasPrice * 12n / 10n; // +20%
      }

      const estimatedGasFee = Number((gasPrice * BASE_GAS_LIMIT * 2n) / ethers.parseUnits("1", "ether")); // ×2 (admin + user)

      setGasFee(estimatedGasFee);
      setError(false);
    } catch (err) {
      console.error("❌ Gas fee fetch error:", err.message);
      setGasFee(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [network, speed]);

  useEffect(() => {
    fetchGasFee();
    const interval = setInterval(fetchGasFee, 30000); // auto refresh kas 30s
    return () => clearInterval(interval);
  }, [fetchGasFee]);

  useEffect(() => {
    const admin = amount ? (Number(amount) * ADMIN_FEE_PERCENT) / 100 : 0;
    setAdminFee(admin);
  }, [amount]);

  useEffect(() => {
    setTotalFee(adminFee + gasFee);
  }, [adminFee, gasFee]);

  return {
    gasFee,
    adminFee,
    totalFee,
    loading,
    error,
    refetchFees: fetchGasFee,
  };
}
