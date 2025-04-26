// src/utils/getProviderForChain.js
"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "@/utils/fallbackRPCs";

/**
 * Returns a JsonRpcProvider or FallbackProvider for the given chainId.
 *
 * @param {string|number} chainIdOrName – the chain ID (e.g. "1", 56, "137", etc)
 * @returns {ethers.JsonRpcProvider|ethers.FallbackProvider}
 */
export function getProviderForChain(chainIdOrName) {
  // Normalize chainId to a number
  const chainId =
    typeof chainIdOrName === "string"
      ? parseInt(chainIdOrName, 10)
      : chainIdOrName;

  // Look up our array of RPC URLs
  const urls = ethersFallbackProviders[chainId];
  if (!urls || urls.length === 0) {
    throw new Error(`❌ No RPC endpoints configured for chainId ${chainId}`);
  }

  // Build a JsonRpcProvider for each URL
  const providers = urls.map((url) =>
    new ethers.JsonRpcProvider(url, chainId)
  );

  // If there's only one, just use it
  if (providers.length === 1) {
    return providers[0];
  }

  // Otherwise wrap them in a FallbackProvider with the correct config objects
  const configs = providers.map((provider, priority) => ({
    provider,
    priority,
    weight: 1,
    stallTimeout: 200
  }));
  // quorum = 1 means only one healthy provider needs to respond
  return new ethers.FallbackProvider(configs, /* quorum */ 1);
}
