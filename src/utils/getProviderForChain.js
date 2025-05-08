// src/utils/getProviderForChain.js
"use client";

import { JsonRpcProvider, FallbackProvider } from "ethers";
import networks from "@/data/networks";

/**
 * Gauti FallbackProvider iš RPC masyvo pagal tinklą.
 * Veikia ir su testnet, ir mainnet. Grąžina FallbackProvider su svoriu = 1 kiekvienam.
 */
export function getProviderForChain(chainId) {
  const net = networks.find(
    (n) => n.chainId === chainId || n.testnet?.chainId === chainId
  );

  if (!net) {
    throw new Error(`[getProviderForChain] Nežinomas chainId: ${chainId}`);
  }

  const rpcUrls =
    net.chainId === chainId
      ? net.rpcUrls
      : net.testnet?.rpcUrls || [];

  if (!rpcUrls.length) {
    throw new Error(`[getProviderForChain] Nėra RPC URL šiam chainId: ${chainId}`);
  }

  const providers = rpcUrls.map((url) => new JsonRpcProvider(url));
  return new FallbackProvider(providers.map((p) => ({ provider: p, weight: 1 })));
}
