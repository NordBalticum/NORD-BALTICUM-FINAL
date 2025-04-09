"use client";

import { useState, useEffect } from "react";
import { estimateGasFee } from "@/utils/gasEstimator"; // Arba savo funkcija
import { calculateAdminFee } from "@/utils/adminFeeCalculator"; // Jei turi

export function useTotalFeeCalculator(network, amount, gasOption) {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = async () => {
    if (!amount || amount <= 0) return; // ✅ Ne refetch jei amount nėra

    setLoading(true);
    setError(null);

    try {
      const gas = await estimateGasFee(network, gasOption);
      const admin = calculateAdminFee(amount);
      setGasFee(gas);
      setAdminFee(admin);
      setTotalFee(gas * 2 + admin);
    } catch (err) {
      console.error("❌ Fee calculation error:", err?.message || err);
      setError(err?.message || "Fee calculation failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [network, amount, gasOption]);

  return { gasFee, adminFee, totalFee, loading, error, refetch };
}
