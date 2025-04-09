"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

// ✅ Patikimi RPC URL'ai
const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
};

// ✅ Konstantos
const BASE_GAS_LIMIT = 21000n;
const ADMIN_FEE_PERCENT = 3; // 3% fee

/**
 * Ultimate Fee Calculator Hook
 * - Apskaičiuoja 2x gas fee + 3% admin fee
 * - Automatinis arba rankinis refetch
 */
export function useTotalFeeCalculator(network, amount, gasOption = "average") {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFees = useCallback(async () => {
    if (!network || !amount || amount <= 0) {
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const rpcUrl = RPC_URLS[network];
      if (!rpcUrl) {
        throw new Error(`Unsupported network: ${network}`);
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const feeData = await provider.getFeeData();
      let gasPrice = feeData?.gasPrice;

      if (!gasPrice) {
        console.warn("⚠️ gasPrice is null, fallback 5 gwei.");
        gasPrice = ethers.parseUnits("5", "gwei");
      }

      if (gasOption === "slow") {
        gasPrice = gasPrice * 8n / 10n; // -20%
      } else if (gasOption === "fast") {
        gasPrice = gasPrice * 12n / 10n; // +20%
      }

      const singleTxGasFee = (gasPrice * BASE_GAS_LIMIT) / ethers.parseUnits("1", "ether");
      const totalGasFee = Number(singleTxGasFee) * 2; // 2x Gas: admin + user

      const calculatedAdminFee = (Number(amount) * ADMIN_FEE_PERCENT) / 100;
      const totalCalculatedFee = totalGasFee + calculatedAdminFee;

      setGasFee(totalGasFee);
      setAdminFee(calculatedAdminFee);
      setTotalFee(totalCalculatedFee);
    } catch (err) {
      console.error("❌ Error fetching fees:", err.message || err);
      setError(err.message || "Failed to fetch fees.");
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
    } finally {
      setLoading(false);
    }
  }, [network, amount, gasOption]);

  useEffect(() => {
    if (amount > 0) {
      fetchFees();
    } else {
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
    }
  }, [amount, network, gasOption, fetchFees]);

  return {
    gasFee,
    adminFee,
    totalFee,
    loading,
    error,
    refetch: fetchFees, // ✅ Rankinis refetch
  };
}
