"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "./fallbackRPCs";

/**
 * Returns a JsonRpcProvider or FallbackProvider for the given chainId.
 *
 * @param {string|number} chainIdOrName – the chain ID (e.g. "1", 56, 137, 43114)
 * @returns {ethers.JsonRpcProvider|ethers.FallbackProvider}
 */
export function getProviderForChain(chainIdOrName) {
  // 1) normalize to number
  const chainId =
    typeof chainIdOrName === "string"
      ? parseInt(chainIdOrName, 10)
      : chainIdOrName;

  // 2) lookup your RPC URLs
  const urls = ethersFallbackProviders[chainId];
  if (!urls?.length) {
    throw new Error(`❌ No RPC endpoints configured for chainId ${chainId}`);
  }

  // 3) if only one URL, return a simple JsonRpcProvider
  if (urls.length === 1) {
    return new ethers.JsonRpcProvider(urls[0], chainId);
  }

  // 4) otherwise build a proper FallbackProvider
  const providers = urls.map((url) => new ethers.JsonRpcProvider(url, chainId));
  const configs = providers.map((provider) => ({
    provider,
    priority: 1,
    weight: 1,
    stallTimeout: 200
  }));

  // **do not pass a second param**—that used to be quorum in v5,
  // but in v6 it’s a `network` config object and will break things.
  return new ethers.FallbackProvider(configs);
}
