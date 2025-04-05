"use client";

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";

// RPC adresai (pakeisk jei turi savo)
const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

const BASE_GAS_LIMIT = 21000; // Basic tx gas limit
const ADMIN_FEE_PERCENT = 3;  // 3% admin mokestis

export function useFeeCalculator(network, amount) {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagrindinis gas paskaičiavimas
  const fetchGasPrice = useCallback(async () => {
    try {
      if (!network) return;
      const provider = new ethers.JsonRpcProvider(RPC_URLS[network]);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits("5", "gwei"); // fallback 5 gwei
      const gasCost = Number(ethers.formatEther(gasPrice * BigInt(BASE_GAS_LIMIT)));
      setGasFee(gasCost);
    } catch (error) {
      console.error("❌ Gas fetch error:", error.message);
      setGasFee(0);
    }
  }, [network]);

  // Live keičiasi kai amount arba network pasikeičia
  useEffect(() => {
    if (amount || network) {
      fetchGasPrice();
    }
  }, [fetchGasPrice, amount, network]);

  // Kas 5 sekundes automatinis atnaujinimas
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGasPrice();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchGasPrice]);

  // Admin fee automatinis paskaičiavimas
  useEffect(() => {
    const adminFeeAmount = amount ? (Number(amount) * ADMIN_FEE_PERCENT) / 100 : 0;
    setAdminFee(adminFeeAmount);
  }, [amount]);

  // Total fee (gas + admin) skaičiavimas
  useEffect(() => {
    setTotalFee(gasFee + adminFee);
    setLoading(false);
  }, [gasFee, adminFee]);

  return {
    gasFee,        // LIVE gas fee
    adminFee,      // 3% admin fee
    totalFee,      // Bendra suma
    loading,       // Loading indikatorius
    refetchFees: fetchGasPrice,  // Rankinis refetch jeigu reikia
  };
}
