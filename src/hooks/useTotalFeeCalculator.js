"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

// ✅ RPC URLs
const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
};

const BASE_GAS_LIMIT = 21000n; // Basic gas limit 21k
const ADMIN_FEE_PERCENT = 3;    // 3% Admin Fee

export function useTotalFeeCalculator(network, amount, gasOption = "average") {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchFees = useCallback(async () => {
    if (!network || !amount) return;

    setLoading(true);
    setError(false);

    try {
      const rpcUrl = RPC_URLS[network];
      if (!rpcUrl) throw new Error("Unsupported network.");

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const feeData = await provider.getFeeData();
      let gasPrice = feeData.gasPrice || ethers.parseUnits("5", "gwei"); // fallback 5 Gwei

      if (gasOption === "slow") {
        gasPrice = gasPrice * 8n / 10n; // -20%
      } else if (gasOption === "fast") {
        gasPrice = gasPrice * 12n / 10n; // +20%
      }

      // Gas fee for one tx
      const oneTxFee = (gasPrice * BASE_GAS_LIMIT) / ethers.parseUnits("1", "ether");
      const doubleTxFee = Number(oneTxFee) * 2; // Admin + User tx

      // Admin fee 3%
      const admin = (Number(amount) * ADMIN_FEE_PERCENT) / 100;

      // Total = 2x gas + 3% admin
      const total = doubleTxFee + admin;

      setGasFee(doubleTxFee);
      setAdminFee(admin);
      setTotalFee(total);
    } catch (err) {
      console.error("❌ Fee calculation error:", err.message);
      setError(true);
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
    } finally {
      setLoading(false);
    }
  }, [network, amount, gasOption]);

  useEffect(() => {
    fetchFees();
    const interval = setInterval(fetchFees, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchFees]);

  return {
    gasFee,    // 2x Gas Fee
    adminFee,  // 3% Admin Fee
    totalFee,  // Total Fee
    loading,   // Loading state
    error,     // Error state
    refetch: fetchFees, // Manual refetch
  };
}
