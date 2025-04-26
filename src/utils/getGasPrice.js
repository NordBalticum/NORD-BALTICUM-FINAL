// src/utils/getGasPrice.js
"use client";

import { ethers } from "ethers";

/**
 * Gaunam dujų kainą bet kokiam provider‘iui, su pasirinktiniais greičio režimais.
 * - Jei provider turi getFeeData(), panaudosime maxFeePerGas EIP-1559 grandims.
 * - Jei ne – grįšime į legacy getGasPrice().
 * - Jei viskas sugriūva arba gauname falsy rezultatą, defaultinam į 5 Gwei.
 *
 * @param {ethers.JsonRpcProvider | ethers.FallbackProvider} provider
 * @param {"slow"|"average"|"fast"} speed  – pasirinkimas: slow=0.9×, average=1×, fast=1.2×
 * @returns {Promise<bigint>}  – grąžina dujų kainą Wei (BigInt)
 */
export async function getGasPrice(provider, speed = "average") {
  try {
    // 1) surenkam bazinę kainą
    let baseFee;
    if (provider.getFeeData) {
      const feeData = await provider.getFeeData();
      // preferuojam EIP-1559, fallback į legacy gasPrice
      baseFee = feeData.maxFeePerGas ?? feeData.gasPrice;
    } else {
      baseFee = await provider.getGasPrice();
    }

    if (!baseFee || typeof baseFee !== "bigint") {
      console.warn("⚠️ Gas price not found, using fallback 5 Gwei.");
      baseFee = ethers.parseUnits("5", "gwei");
    }

    // 2) pritaikom greičio multiplier’į (0.9× arba 1.2×)
    let adjusted;
    if (speed === "slow") {
      adjusted = baseFee * 9n / 10n;
    } else if (speed === "fast") {
      adjusted = baseFee * 12n / 10n;
    } else {
      adjusted = baseFee;
    }

    console.debug(
      `⛽ Gas Price (${speed}):`,
      ethers.formatUnits(adjusted, "gwei"),
      "Gwei"
    );
    return adjusted;
  } catch (err) {
    console.error("❌ Failed to get gas price:", err?.message || err);
    // 3) klaidos atveju grįžtam prie safe fallback
    return ethers.parseUnits("5", "gwei");
  }
}
