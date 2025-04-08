"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getGasPrice } from "@/utils/getGasPrice";

const BASE_GAS_LIMIT = 21000;
const ADMIN_FEE_PERCENT = 3;

export function useFeeCalculator(network, amount, speed = "average") {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchFees = useCallback(async () => {
    if (!network) return;

    try {
      const gasPrice = await getGasPrice(network, speed);
      const gasCost = Number(ethers.formatEther(gasPrice * BigInt(BASE_GAS_LIMIT)));
      setGasFee(gasCost);
      setError(false);
    } catch (err) {
      console.error("❌ Gas fee fetch error:", err.message);
      setGasFee(0);
      setError(true);
    }
  }, [network, speed]);

  useEffect(() => {
    fetchFees();
    const interval = setInterval(fetchFees, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [fetchFees]);

  useEffect(() => {
    const fee = amount ? (Number(amount) * ADMIN_FEE_PERCENT) / 100 : 0;
    setAdminFee(fee);
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
    error,
    refetchFees: fetchFees,
  };
}
