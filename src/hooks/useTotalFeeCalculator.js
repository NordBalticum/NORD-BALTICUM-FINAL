"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getGasPrice } from "@/utils/getGasPrice";
import { RPC } from "@/contexts/AuthContext"; // <-- IMPORTUOJAM TAVO RPC

export function useTotalFeeCalculator(network, amount, gasOption = "average") {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateFees = useCallback(async () => {
    if (!network || !amount || amount <= 0) {
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const rpcUrl = RPC[network];
      if (!rpcUrl) throw new Error(`Unsupported network: ${network}`);

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const gasPrice = await getGasPrice(provider, gasOption);

      const estimatedGasFee = Number(ethers.formatEther(gasPrice * 21000n * 2n));
      const parsedAmount = Number(amount);
      const estimatedAdminFee = parsedAmount * 0.03;
      const total = estimatedGasFee + estimatedAdminFee;

      setGasFee(estimatedGasFee);
      setAdminFee(estimatedAdminFee);
      setTotalFee(total);
    } catch (err) {
      console.error("❌ Fee calculation error:", err?.message || err);
      setError(err?.message || "Fee calculation failed.");
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
    } finally {
      setLoading(false);
    }
  }, [network, amount, gasOption]);

  useEffect(() => {
    calculateFees();
  }, [calculateFees]);

  return {
    gasFee,
    adminFee,
    totalFee,
    loading,
    error,
    refetchFees: calculateFees,
  };
}
