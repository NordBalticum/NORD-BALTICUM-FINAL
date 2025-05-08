// src/utils/getGasPrice.js
"use client";

import { ethers } from "ethers";

/**
 * MetaMask-grade universal gas price fetcher.
 * - Supports EIP-1559 + legacy
 * - Applies speed multipliers (slow, avg, fast)
 * - Fallback to 5 Gwei on any node failure
 *
 * @param {ethers.JsonRpcProvider | ethers.FallbackProvider} provider
 * @param {"slow"|"avg"|"fast"} speed
 * @returns {Promise<bigint>} gas price in Wei
 */
export async function getGasPrice(provider, speed = "avg") {
  try {
    const feeData = await provider.getFeeData();
    const supports1559 = feeData.maxFeePerGas && feeData.maxPriorityFeePerGas;

    let base = supports1559
      ? feeData.maxFeePerGas
      : feeData.gasPrice ?? await provider.getGasPrice();

    if (!base || typeof base !== "bigint") {
      console.warn("⚠️ Invalid gas price, fallback to 5 Gwei.");
      base = ethers.parseUnits("5", "gwei");
    }

    let multiplier = {
      slow: 90n,   // 0.9x
      avg: 100n,   // 1.0x
      fast: 120n,  // 1.2x
    }[speed] ?? 100n;

    const adjusted = (base * multiplier) / 100n;

    console.debug(`⛽ Gas price [${speed}]: ${ethers.formatUnits(adjusted, "gwei")} Gwei`);
    return adjusted;
  } catch (err) {
    console.error("❌ getGasPrice() failed:", err.message || err);
    return ethers.parseUnits("5", "gwei");
  }
}
