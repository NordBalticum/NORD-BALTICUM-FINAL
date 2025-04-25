// src/utils/getProviderForChain.js
"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "@/utils/fallbackRPCs";

/**
 * Returns a JsonRpcProvider or FallbackProvider for the given chainId.
 *
 * @param {string|number} chainIdOrName – the chain ID (e.g. "1", 56, 97, 137, 43114)
 * @returns {ethers.JsonRpcProvider|ethers.FallbackProvider}
 */
export function getProviderForChain(chainIdOrName) {
  // Normalize chainId to a number
  const chainId =
    typeof chainIdOrName === "string"
      ? parseInt(chainIdOrName, 10)
      : chainIdOrName;

  const urls = ethersFallbackProviders[chainId];
  if (!urls || urls.length === 0) {
    throw new Error(`❌ No RPC endpoints configured for chainId ${chainId}`);
  }

  // Build a JsonRpcProvider for each URL
  const providers = urls.map((url) =>
    new ethers.JsonRpcProvider(url, chainId)
  );

  // If only one endpoint, return it directly
  if (providers.length === 1) {
    return providers[0];
  }

  // Otherwise return a FallbackProvider over all URLs (quorum defaults to 1)
  return new ethers.FallbackProvider(providers);
}
