"use client";

import { ethers } from "ethers";

export async function getEstimatedGasFee(network, speed = "average") {
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
  const feeData = await provider.getFeeData();

  if (!feeData.gasPrice) throw new Error("Failed to fetch gas price");

  let gasPrice = feeData.gasPrice;

  // Pritaikome pasirinkimą
  if (speed === "slow") {
    gasPrice = gasPrice * 8n / 10n; // -20%
  } else if (speed === "fast") {
    gasPrice = gasPrice * 12n / 10n; // +20%
  }

  const gasLimit = 21000n; // Basic ETH send gas limit
  const estimatedFee = (gasPrice * gasLimit) / ethers.parseUnits("1", "ether");

  return Number(estimatedFee) * 2; // ❗ Nes DVI transakcijos: 1 admin, 1 user
}
