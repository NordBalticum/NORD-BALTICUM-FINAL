// src/utils/getProviderForChain.js
"use client";

import { JsonRpcProvider, FallbackProvider } from "ethers";
import networks from "@/data/networks";

export function getProviderForChain(chainId) {
  const net = networks.find(
    (n) => n.chainId === chainId || n.testnet?.chainId === chainId
  );

  if (!net) {
    throw new Error(`[getProviderForChain] Unknown chainId: ${chainId}`);
  }

  const rpcUrls =
    net.chainId === chainId
      ? net.rpcUrls
      : net.testnet?.rpcUrls || [];

  if (!rpcUrls.length) {
    throw new Error(`[getProviderForChain] No RPC URLs found for chainId: ${chainId}`);
  }

  const providers = rpcUrls.map((url) => new JsonRpcProvider(url));
  return new FallbackProvider(providers, 1);
}
