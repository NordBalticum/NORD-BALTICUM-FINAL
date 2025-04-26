// src/utils/getGasPrice.js
"use client";

import { ethers } from "ethers";

/**
 * Fetches a gas price suitable for any EVM network (1559 or legacy).
 *
 * - If the provider supports EIP-1559 (getFeeData), we use maxFeePerGas (or gasPrice fallback).
 * - Otherwise we call the legacy getGasPrice().
 * - We apply a speed multiplier: slow = 0.9×, average = 1×, fast = 1.2×.
 * - On any failure or missing data, defaults to 5 Gwei.
 *
 * @param {ethers.JsonRpcProvider|ethers.FallbackProvider} provider
 * @param {"slow"|"average"|"fast"} speed
 * @returns {Promise<bigint>} gas price in Wei
 */
export async function getGasPrice(provider, speed = "average") {
  try {
    // 1) Base fee retrieval
    let baseFee;
    if (typeof provider.getFeeData === "function") {
      // EIP-1559 enabled
      const feeData = await provider.getFeeData();
      // prefer maxFeePerGas, otherwise gasPrice if some older node
      baseFee = feeData.maxFeePerGas ?? feeData.gasPrice;
    } else {
      // Legacy networks
      baseFee = await provider.getGasPrice();
    }

    // 2) Validate
    if (!baseFee || typeof baseFee !== "bigint") {
      console.warn("⚠️ Gas price not found or invalid, falling back to 5 Gwei.");
      baseFee = ethers.parseUnits("5", "gwei");
    }

    // 3) Apply speed multiplier
    let adjusted;
    switch (speed) {
      case "slow":
        adjusted = (baseFee * 9n) / 10n;   // 0.9×
        break;
      case "fast":
        adjusted = (baseFee * 12n) / 10n;  // 1.2×
        break;
      default:
        adjusted = baseFee;                // 1×
    }

    console.debug(
      `⛽ Gas Price (${speed}):`,
      ethers.formatUnits(adjusted, "gwei"),
      "Gwei"
    );
    return adjusted;
  } catch (err) {
    console.error("❌ getGasPrice error:", err?.message || err);
    return ethers.parseUnits("5", "gwei");
  }
}
