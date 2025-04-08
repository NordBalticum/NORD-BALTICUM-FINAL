// utils/getEstimatedGasFee.js

"use client";

import { ethers } from "ethers";

export async function getEstimatedGasFee(network) {
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
  const gasPrice = feeData.gasPrice;

  if (!gasPrice) throw new Error("Failed to fetch gas price");

  const gasLimit = 21000n; // Normal ETH send
  const estimatedFee = (gasPrice * gasLimit) / ethers.parseUnits("1", "ether"); // ETH/BSC gas fees are per 1 ETH unit

  return Number(estimatedFee);
}
