"use client";

import { ethers } from "ethers";

/**
 * Ultimate getGasPrice funkcija
 * - Gali pasirinkti: slow, average, fast
 * - Jei RPC negrąžina normalios kainos, defaultinam į safe fallback
 * 
 * @param {ethers.JsonRpcProvider} provider 
 * @param {"slow" | "average" | "fast"} speed 
 * @returns {Promise<bigint>}
 */
export async function getGasPrice(provider, speed = "average") {
  try {
    const gasPrice = await provider.getGasPrice(); // Grąžina BigInt

    if (!gasPrice) {
      console.warn("⚠️ Gas price not found, using fallback value.");
      return ethers.parseUnits("5", "gwei"); // Default fallback 5 Gwei
    }

    // ✅ Parenkam multiplier pagal greitį
    let multiplier = 1n;
    if (speed === "slow") multiplier = 9n / 10n; // 0.9x (lėtesnis ir pigesnis)
    if (speed === "fast") multiplier = 12n / 10n; // 1.2x (greitesnis)

    const adjustedGasPrice = gasPrice * multiplier;

    console.log(`⛽ Gas Price (${speed}):`, ethers.formatUnits(adjustedGasPrice, "gwei"), "Gwei");

    return adjustedGasPrice;
  } catch (error) {
    console.error("❌ Failed to get gas price:", error?.message || error);

    // Jei klaida – fallback į saugų variantą
    return ethers.parseUnits("5", "gwei");
  }
}
