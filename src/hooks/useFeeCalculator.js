"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

const ADMIN_FEE_PERCENT = 3;

export function useFeeCalculator(network, amount, receiver = "") {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchGasEstimate = useCallback(async () => {
    try {
      if (!network) return;
      if (!receiver || Number(amount) <= 0) {
        setGasFee(0);
        return;
      }

      const provider = new ethers.JsonRpcProvider(RPC_URLS[network]);
      const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits("5", "gwei");

      const estimatedGas = await provider.estimateGas({
        to: receiver,
        value: ethers.parseEther(amount.toString())
      });

      const totalGasCost = Number(ethers.formatEther(gasPrice * estimatedGas));
      setGasFee(totalGasCost);
    } catch (error) {
      console.error("❌ Gas estimate error:", error.message);
      setGasFee(0);
    }
  }, [network, amount, receiver]);

  useEffect(() => {
    fetchGasEstimate();
    const interval = setInterval(fetchGasEstimate, 10000); // atnaujinam kas 10s
    return () => clearInterval(interval);
  }, [fetchGasEstimate]);

  useEffect(() => {
    if (amount) {
      const adminFeeAmount = (Number(amount) * ADMIN_FEE_PERCENT) / 100;
      setAdminFee(adminFeeAmount);
    } else {
      setAdminFee(0);
    }
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
  };
}
