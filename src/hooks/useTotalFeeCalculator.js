"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getGasPrice } from "@/utils/getGasPrice";

/**
 * Ultimate Total Fee Calculator
 * - Suskaičiuoja 2x Gas Fee + 3% Admin Fee
 * - Naudojamas tik kai reikia, niekada neloopina
 * - Viskas automatiškai apskaičiuojama
 */
export function useTotalFeeCalculator(network, amount, gasOption = "average") {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function calculateFees() {
      if (!network || !amount || amount <= 0) {
        setGasFee(0);
        setAdminFee(0);
        setTotalFee(0);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const RPC_URLS = {
          ethereum: "https://rpc.ankr.com/eth",
          bsc: "https://bsc-dataseed.bnbchain.org",
          tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
          polygon: "https://polygon-rpc.com",
          avalanche: "https://api.avax.network/ext/bc/C/rpc",
        };

        const rpcUrl = RPC_URLS[network];
        if (!rpcUrl) throw new Error(`Unsupported network: ${network}`);

        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // ✅ Gauti gas price pagal pasirinktą greitį
        const gasPrice = await getGasPrice(provider, gasOption);

        // ✅ 21000 gas * price * 2 (dvi transakcijos: admin fee + user send)
        const estimatedGasFee = Number(ethers.formatEther(gasPrice * 21000n * 2n)); 

        // ✅ Admin fee 3% nuo įvedamo amount
        const parsedAmount = Number(amount);
        const estimatedAdminFee = parsedAmount * 0.03; 

        // ✅ Total fees
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
    }

    calculateFees();
  }, [network, amount, gasOption]);

  return {
    gasFee,
    adminFee,
    totalFee,
    loading,
    error,
  };
}
