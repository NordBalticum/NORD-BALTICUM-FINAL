"use client";

import { ethers } from "ethers";

// ✅ Gauti estimated gas fee priklausomai nuo pasirinkimo
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
  const gasPrice = feeData.gasPrice;

  if (!gasPrice) throw new Error("❌ Failed to fetch gas price");

  let finalGasPrice = gasPrice;

  // ✅ Priklausomai nuo vartotojo pasirinkimo (slow / average / fast)
  if (speed === "slow") {
    finalGasPrice = gasPrice * 8n / 10n; // 0.8x
  } else if (speed === "fast") {
    finalGasPrice = gasPrice * 15n / 10n; // 1.5x
  }

  const gasLimit = 21000n; // Normalus transfer
  const estimatedFee = (finalGasPrice * gasLimit) / ethers.parseUnits("1", "ether");

  return Number(estimatedFee);
}
