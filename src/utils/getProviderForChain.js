"use client";

import { JsonRpcProvider } from "ethers";
import { ethersFallbackProviders } from "../constants/fallbackRPCs";

export const getProviderForChain = (chainId) => {
  const fallbackURLs = ethersFallbackProviders[chainId];

  if (!fallbackURLs || fallbackURLs.length === 0) {
    throw new Error(`No fallback RPCs found for chainId ${chainId}`);
  }

  // Tik vienas URL – grąžinam paprastą providerį
  if (fallbackURLs.length === 1) {
    return new JsonRpcProvider(fallbackURLs[0]);
  }

  // Keli URL – grąžinam fallback providerį su prioriteto tvarka
  const providers = fallbackURLs.map((url) => new JsonRpcProvider(url));

  return new ethers.FallbackProvider(providers, {
    quorum: 1, // Gali būti padidintas jei nori daugiau patvirtinimų
    weight: providers.map(() => 1),
  });
};
