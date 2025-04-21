"use client";

import { JsonRpcProvider, FallbackProvider } from "ethers";
import { ethersFallbackProviders } from "@/utils/fallbackRPCs";

/**
 * Grąžina saugų providerį, su fallback mechanizmu
 * @param {number|string} chainId - chainId kaip skaičius (pvz. 1, 137, 56)
 * @returns {JsonRpcProvider|FallbackProvider}
 */
export const getProviderForChain = (chainId) => {
  const id = typeof chainId === "string" ? parseInt(chainId) : chainId;
  const fallbackURLs = ethersFallbackProviders[id];

  if (!fallbackURLs || fallbackURLs.length === 0) {
    throw new Error(`❌ No fallback RPCs found for chainId ${id}`);
  }

  if (fallbackURLs.length === 1) {
    return new JsonRpcProvider(fallbackURLs[0], id);
  }

  const providers = fallbackURLs.map((url) => new JsonRpcProvider(url, id));
  return new FallbackProvider(providers, {
    quorum: 1,
    weight: providers.map(() => 1),
  });
};
