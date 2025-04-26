// src/utils/getProviderForChain.js
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
  // 1) normalize to a number
  const chainId =
    typeof chainIdOrName === "string"
      ? parseInt(chainIdOrName, 10)
      : chainIdOrName;

  // 2) look up your array of URLs
  const urls = ethersFallbackProviders[chainId];
  if (!urls?.length) {
    throw new Error(`❌ No RPC endpoints configured for chainId ${chainId}`);
  }

  // 3) If there's only one endpoint, just return a JsonRpcProvider
  if (urls.length === 1) {
    return new ethers.JsonRpcProvider(urls[0], chainId);
  }

  // 4) Otherwise wrap them in a FallbackProvider
  //    Build one JsonRpcProvider per URL:
  const providers = urls.map((url) => new ethers.JsonRpcProvider(url, chainId));

  //    Give each a minimal priority/weight (we only need one to succeed):
  const configs = providers.map((provider) => ({
    provider,
    priority:    1,
    weight:      1,
    stallTimeout: 200,
    // **do not** put `quorum` here; ethers v6 ignores it
  }));

  //    **Key fix**: don’t pass a second param
  return new ethers.FallbackProvider(configs);
}
