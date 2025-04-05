"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

// ✅ Geriausi RPC URL pagal tinklą
const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

// ✅ Hook'as gyvam fee skaičiavimui
export function useFeeCalculator(network, amount) {
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!network || !amount || isNaN(amount)) return;

    const fetchFees = async () => {
      try {
        setLoading(true);

        const provider = new ethers.JsonRpcProvider(RPC_URLS[network]);
        const gasPrice = await provider.getGasPrice(); // Live gas price
        const gasLimit = 21000n; // Basic ETH transfer

        const gasCost = gasPrice * gasLimit; // BigInt
        const gasCostEth = parseFloat(ethers.formatEther(gasCost)); // ETH -> normal number

        const amountEth = parseFloat(amount);
        const adminFeeEth = amountEth * 0.03; // 3%

        const totalFees = gasCostEth + adminFeeEth;

        setGasFee(gasCostEth);
        setAdminFee(adminFeeEth);
        setTotalFee(totalFees);
      } catch (error) {
        console.error("❌ Fee calculation error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFees();

    const interval = setInterval(fetchFees, 15000); // ✅ Atkartoti kas 15s
    return () => clearInterval(interval);
  }, [network, amount]);

  return { gasFee, adminFee, totalFee, loading };
}
