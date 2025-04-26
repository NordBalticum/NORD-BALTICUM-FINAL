// src/utils/getProviderForChain.js
"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "@/utils/fallbackRPCs";

/**
 * Returns a JsonRpcProvider or FallbackProvider for the given chainId.
 * Wraps each RPC URL in the proper config so ethers.FallbackProvider
 * knows these are providers, not a "network" descriptor.
 *
 * @param {string|number} chainIdOrName – the chain ID (e.g. "1", 56, 97, 137, 43114)
 * @returns {ethers.JsonRpcProvider|ethers.FallbackProvider}
 */
export function getProviderForChain(chainIdOrName) {
  // Normalize to number
  const chainId =
    typeof chainIdOrName === "string"
      ? parseInt(chainIdOrName, 10)
      : chainIdOrName;

  // Look up our configured RPC endpoints
  const urls = ethersFallbackProviders[chainId];
  if (!urls || urls.length === 0) {
    throw new Error(`❌ No RPC endpoints configured for chainId ${chainId}`);
  }

  // Create a JsonRpcProvider for each URL
  const providers = urls.map((url) => new ethers.JsonRpcProvider(url, chainId));

  // Single‐endpoint → return it directly
  if (providers.length === 1) {
    return providers[0];
  }

  // Multi‐endpoint → wrap each provider in a config object
  const fallbackConfigs = providers.map((provider) => ({ provider }));

  // FallbackProvider now sees an array of { provider } and works correctly
  return new ethers.FallbackProvider(fallbackConfigs);
}
