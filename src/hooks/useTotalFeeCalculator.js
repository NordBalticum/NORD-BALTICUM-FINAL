"use client";

import { useState, useEffect } from "react";
import { getGasPrice } from "@/utils/getGasPrice";

/**
 * Ultimate Total Fee Calculator
 * - 2x Gas Fee (už du pavedimus)
 * - 3% Admin Fee (iš amount)
 */
export function useTotalFeeCalculator(network, amount, gasOption = "average") {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function calculateFees() {
    if (!network || !amount || amount <= 0) {
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Gauti gas price
      const gasPrice = await getGasPrice(network, gasOption);
      const gasPerTx = gasPrice * 21000n; // kiekvienas pavedimas 21000 gas
      const totalGasFee = Number(gasPerTx * 2n) / 1e18; // 2 pavedimai

      // 2. Paskaičiuoti Admin Fee (3%)
      const adminFeeCalc = Number(amount) * 0.03;

      // 3. Paskaičiuoti bendrą Total Fee
      const totalFeeCalc = totalGasFee + adminFeeCalc;

      // 4. Išsaugoti
      setGasFee(totalGasFee);
      setAdminFee(adminFeeCalc);
      setTotalFee(totalFeeCalc);
    } catch (err) {
      console.error("❌ Fee calculation error:", err?.message || err);
      setError(err?.message || "Fee calculation error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    calculateFees();
  }, [network, amount, gasOption]);

  return {
    gasFee,
    adminFee,
    totalFee,
    loading,
    error,
    refetch: calculateFees,
  };
}
