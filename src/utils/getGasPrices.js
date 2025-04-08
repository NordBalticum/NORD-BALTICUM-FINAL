"use client";

import { ethers } from "ethers";

const RPC_URLS = {
  ethereum: "https://rpc.ankr.com/eth",
  bsc: "https://bsc-dataseed.bnbchain.org",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
};

export async function getGasPrice(network, speed = "average") {
  const rpcUrl = RPC_URLS[network];
  if (!rpcUrl) throw new Error(`Unsupported network: ${network}`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  let feeData;
  try {
    feeData = await provider.getFeeData();
  } catch (error) {
    throw new Error("❌ Failed to fetch fee data from RPC.");
  }

  let gasPrice = feeData?.gasPrice;
  if (!gasPrice) {
    console.warn("⚠️ Gas price is null, using fallback 5 Gwei.");
    gasPrice = ethers.parseUnits("5", "gwei");
  }

  if (speed === "slow") {
    gasPrice = gasPrice.mul(80).div(100); // -20%
  } else if (speed === "fast") {
    gasPrice = gasPrice.mul(120).div(100); // +20%
  }

  return gasPrice;
}
