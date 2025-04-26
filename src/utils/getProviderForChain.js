// src/utils/getProviderForChain.js
"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "@/utils/fallbackRPCs";

/**
 * Returns an ethers Provider (JsonRpcProvider or FallbackProvider)
 * for the given chainId.
 *
 * - If there's only one URL configured → returns a JsonRpcProvider.
 * - If multiple URLs → returns a FallbackProvider with quorum=1.
 * - Throws if no URLs are configured.
 *
 * @param {string|number} chainIdOrName  Chain ID (e.g. "1", 137, 56, 97, 43114)
 * @returns {ethers.JsonRpcProvider|ethers.FallbackProvider}
 */
export function getProviderForChain(chainIdOrName) {
  // Normalize to number
  const chainId =
    typeof chainIdOrName === "string"
      ? parseInt(chainIdOrName, 10)
      : chainIdOrName;

  // Lookup RPC URLs from your fallbackRPCs map
  const urls = ethersFallbackProviders[chainId];
  if (!urls || urls.length === 0) {
    throw new Error(`❌ No RPC endpoints configured for chainId ${chainId}`);
  }

  // Build a JsonRpcProvider for each URL
  const providers = urls.map((url) => new ethers.JsonRpcProvider(url, chainId));

  // If there's only one endpoint, use it directly
  if (providers.length === 1) {
    return providers[0];
  }

  // Otherwise wrap in a FallbackProvider:
  // - priority: lower number = higher priority
  // - weight:  all 1 for equal weighting
  // - stallTimeout: switch if no response in 200ms
  const configs = providers.map((provider, idx) => ({
    provider,
    priority: idx,
    weight: 1,
    stallTimeout: 200,
  }));

  // quorum = 1 means only one healthy provider needs to respond
  return new ethers.FallbackProvider(configs, /* quorum */ 1);
}
