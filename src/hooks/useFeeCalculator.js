"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";

// RPC URL'ai pagal tinklą
const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

// Admin Fee konstantos
const BASE_GAS_LIMIT = 21000n;
const ADMIN_FEE_PERCENT = 3; // 3%

export function useTotalFeeCalculator(network, amount, gasOption = "average") {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFees = useCallback(async () => {
    if (!network || !amount || amount <= 0) {
      // Jeigu duomenų nėra arba amount <= 0, resetinam
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
        console.warn("⚠️ Gas price null, fallback 5 Gwei");
        gasPrice = ethers.parseUnits("5", "gwei");
      }

      if (gasOption === "slow") {
        gasPrice = gasPrice * 8n / 10n; // -20%
      } else if (gasOption === "fast") {
        gasPrice = gasPrice * 12n / 10n; // +20%
      }

      const singleTxGasFee = (gasPrice * BASE_GAS_LIMIT) / ethers.parseUnits("1", "ether");
      const totalGasFee = Number(singleTxGasFee) * 2; // 2 transakcijos: admin + user

      const calculatedAdminFee = (Number(amount) * ADMIN_FEE_PERCENT) / 100;
      const totalCalculatedFee = totalGasFee + calculatedAdminFee;

      setGasFee(totalGasFee);
      setAdminFee(calculatedAdminFee);
      setTotalFee(totalCalculatedFee);
    } catch (err) {
      console.error("❌ Fee fetch error:", err.message);
      setError(err.message || "Failed to fetch fees");
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
    } finally {
      setLoading(false);
    }
  }, [network, amount, gasOption]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  return {
    gasFee,        // 2x Gas Fee (admin + user)
    adminFee,      // 3% Admin Fee
    totalFee,      // Viso bendros fees
    loading,       // Loading indikatorius
    error,         // Klaidos tekstas jei yra
    refetch: fetchFees, // Rankinis refetch
  };
}
