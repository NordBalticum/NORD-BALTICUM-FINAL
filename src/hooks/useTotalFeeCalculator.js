"use client";

import { useState, useEffect, useCallback } from "react";
import { estimateGasFee } from "@/utils/gasEstimator";
import { calculateAdminFee } from "@/utils/adminFeeCalculator";

/**
 * Ultimate Total Fee Calculator Hook
 * - Automatiškai apskaičiuoja Gas Fee (2x) + Admin Fee (3%) sumą
 * - Grąžina visas reikšmes: gasFee, adminFee, totalFee
 */
export function useTotalFeeCalculator(network, amount, gasOption) {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchFees = useCallback(async () => {
    if (!network || !amount || amount <= 0) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const singleGasFee = await estimateGasFee(network, gasOption);
      const doubleGasFee = singleGasFee * 2; // 2x nes 2 pavedimai (admin + receiver)

      const adminFeeValue = calculateAdminFee(amount);

      const total = doubleGasFee + adminFeeValue;

      setGasFee(doubleGasFee);
      setAdminFee(adminFeeValue);
      setTotalFee(total);
    } catch (err) {
      console.error("❌ Fee calculation error:", err?.message || err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [network, amount, gasOption]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  return {
    gasFee,
    adminFee,
    totalFee,
    loading,
    error,
    refetch: fetchFees,
  };
}
