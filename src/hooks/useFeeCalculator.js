"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

// ✅ RPC URL'ai
const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

// ✅ 3% admin fee
const ADMIN_FEE_PERCENT = 3;

export function useFeeCalculator(network, amount) {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!network || !amount) {
      setGasFee(0);
      setAdminFee(0);
      setTotalFee(0);
      return;
    }

    const fetchFeeData = async () => {
      try {
        setLoading(true);

        const rpcUrl = RPC_URLS[network];
        if (!rpcUrl) throw new Error("Unsupported network");

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const feeData = await provider.getFeeData();

        const gasPrice = feeData.gasPrice || ethers.parseUnits("5", "gwei"); // fallback
        const estimatedGas = BigInt(21000); // Paprastas transfer

        const gasCost = Number(ethers.formatEther(gasPrice * estimatedGas));

        const adminFeeAmount = (Number(amount) * ADMIN_FEE_PERCENT) / 100;

        const totalCost = gasCost + adminFeeAmount;

        setGasFee(gasCost);
        setAdminFee(adminFeeAmount);
        setTotalFee(totalCost);

      } catch (error) {
        console.error("❌ Error fetching fee data:", error.message);
        setGasFee(0);
        setAdminFee((Number(amount) * ADMIN_FEE_PERCENT) / 100);
        setTotalFee((Number(amount) * ADMIN_FEE_PERCENT) / 100);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeData();

    const interval = setInterval(fetchFeeData, 10000); // ✅ Kas 10 sek atnaujina
    return () => clearInterval(interval);
  }, [network, amount]);

  return { gasFee, adminFee, totalFee, loading };
}
