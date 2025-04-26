// src/utils/getProviderForChain.js
"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "@/utils/fallbackRPCs";

/**
 * Returns a JsonRpcProvider or FallbackProvider for the given chainId.
 *
 * @param {string|number} chainIdOrName – the chain ID (e.g. "1", 56, 137, 43114)
 * @returns {ethers.JsonRpcProvider|ethers.FallbackProvider}
 */
export function getProviderForChain(chainIdOrName) {
  // 1) normalize
  const chainId =
    typeof chainIdOrName === "string"
      ? parseInt(chainIdOrName, 10)
      : chainIdOrName;

  // 2) look up your RPC URLs
  const urls = ethersFallbackProviders[chainId];
  if (!urls?.length) {
    throw new Error(`❌ No RPC endpoints configured for chainId ${chainId}`);
  }

  // 3) construct an ethers provider for each URL
  const providers = urls.map((url) => new ethers.JsonRpcProvider(url, chainId));

  // 4) if only one, return it directly
  if (providers.length === 1) {
    return providers[0];
  }

  // 5) wrap in a FallbackProvider – **do not** pass a second param here,
  //    because ethers v6 will interpret it as “network” config (not quorum).
  const configs = providers.map((provider, priority) => ({
    provider,
    priority,
    weight: 1,
    stallTimeout: 200
  }));
  return new ethers.FallbackProvider(configs);
}
