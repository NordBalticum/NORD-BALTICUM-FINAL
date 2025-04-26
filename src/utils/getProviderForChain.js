// src/utils/getProviderForChain.js
"use client";

import { ethers } from "ethers";
import { ethersFallbackProviders } from "@/utils/fallbackRPCs";

/**
 * Grąžina JsonRpcProvider arba FallbackProvider pagal chainId
 */
export function getProviderForChain(chainIdOrName) {
  const chainId =
    typeof chainIdOrName === "string"
      ? parseInt(chainIdOrName, 10)
      : chainIdOrName;

  const urls = ethersFallbackProviders[chainId];
  if (!urls || urls.length === 0) {
    throw new Error(`❌ No RPC endpoints configured for chainId ${chainId}`);
  }

  const providers = urls.map(
    (url) => new ethers.JsonRpcProvider(url, chainId)
  );

  return providers.length === 1
    ? providers[0]
    : new ethers.FallbackProvider(providers, { quorum: 1 });
}
