"use client";

import { ethers } from "ethers";

// ✅ RPC endpoint'ai
const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
};

// ✅ Pagrindinė gas price funkcija
export async function estimateGasFee(network, gasOption = "average") {
  const rpcUrl = RPC_URLS[network];
  if (!rpcUrl) throw new Error(`Unsupported network: ${network}`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const gasPrice = await provider.getGasPrice();

  let multiplier = 1;
  if (gasOption === "slow") multiplier = 0.9;
  if (gasOption === "fast") multiplier = 1.1;

  const adjustedGasPrice = gasPrice * multiplier;

  const gasLimit = 21000; // Paprastai siunčiant paprastą TX
  const estimatedFee = (adjustedGasPrice * gasLimit) / 1e18; // Į ETH/BNB/MATIC/AVAX

  return estimatedFee; // grąžina kaip skaičių
}
