// src/utils/getGasPrice.js
"use client";

import { ethers } from "ethers";

/**
 * Bulletproof universal gas price getter (EVM + ERC20 + all edge cases).
 * Works on any 1559 or legacy chain with fallback and multiplier logic.
 *
 * @param {ethers.JsonRpcProvider | ethers.FallbackProvider} provider
 * @param {"slow"|"avg"|"fast"} speed
 * @returns {Promise<bigint>} gas price in Wei
 */
export async function getGasPrice(provider, speed = "avg") {
  try {
    let base;

    // 1) Try full feeData
    try {
      const feeData = await provider.getFeeData();
      base = feeData.maxFeePerGas || feeData.gasPrice || null;
    } catch (innerErr) {
      console.warn("⚠️ provider.getFeeData() failed, trying getGasPrice()");
    }

    // 2) Fallback if feeData missing or broken
    if (!base || typeof base !== "bigint") {
      try {
        base = await provider.getGasPrice();
      } catch {
        console.warn("⚠️ provider.getGasPrice() also failed, defaulting...");
      }
    }

    // 3) Final fallback
    if (!base || typeof base !== "bigint") {
      console.warn("⚠️ Invalid gas price, using fallback 5 Gwei.");
      base = ethers.parseUnits("5", "gwei");
    }

    // 4) Multiplier
    const multiplier = {
      slow: 90n,
      avg: 100n,
      fast: 120n,
    }[speed] ?? 100n;

    const adjusted = (base * multiplier) / 100n;

    console.debug(`⛽ Gas price [${speed}]: ${ethers.formatUnits(adjusted, "gwei")} Gwei`);
    return adjusted;
  } catch (err) {
    console.error("❌ getGasPrice() critical failure:", err.message || err);
    return ethers.parseUnits("5", "gwei");
  }
}
