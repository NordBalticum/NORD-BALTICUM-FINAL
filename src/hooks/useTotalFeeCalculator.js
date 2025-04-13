"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { getGasPrice } from "@/utils/getGasPrice";
import { RPC } from "@/contexts/AuthContext"; // ✅ Importuojam RPC sąrašą

// ✅ Fallback jeigu RPC arba GasPrice neveikia
const FALLBACK_GAS_PRICE_GWEI = 5n; // 5 GWEI

export function useTotalFeeCalculator(network, amount, gasOption = "average") {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [firstLoading, setFirstLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateFees = useCallback(async () => {
    if (!network || !amount || amount <= 0) {
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
      return;
    }

    try {
      setSilentLoading(true);
      setError(null);

      const rpcUrl = RPC[network];
      if (!rpcUrl) throw new Error(`Unsupported network: ${network}`);

      const provider = new ethers.JsonRpcProvider(rpcUrl);

      let gasPrice;
      try {
        gasPrice = await getGasPrice(provider, gasOption);
      } catch (error) {
        console.warn(`⚠️ getGasPrice failed on ${network}, using fallback 5 GWEI.`);
        gasPrice = ethers.parseUnits(FALLBACK_GAS_PRICE_GWEI.toString(), "gwei");
      }

      // ✅ Gas naudojamas 21000 (standartiniam transfer) * 2 (extra buffer)
      const estimatedGasFee = Number(ethers.formatEther(gasPrice * 21000n * 2n));

      const parsedAmount = Number(amount);
      const estimatedAdminFee = parsedAmount * 0.03; // 3% admin fee
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
      setSilentLoading(false);
      setFirstLoading(false);
    }
  }, [network, amount, gasOption]);

  // ✅ Automatinis skaičiavimas kai keičiasi network/amount
  useEffect(() => {
    calculateFees();
  }, [calculateFees]);

  return {
    gasFee,             // ✅ Estimacija Gas Fee (BNB ar ETH)
    adminFee,           // ✅ 3% admin fee
    totalFee,           // ✅ Viso (gas + admin fee)
    loading: firstLoading,    // ✅ Pirmas spinner (kai nėra duomenų)
    silentLoading,             // ✅ Po to fone tyliai
    error,              // ✅ Klaida jei RPC lūžta
    refetchFees: calculateFees, // ✅ Rankinis paskaičiavimas
  };
}
