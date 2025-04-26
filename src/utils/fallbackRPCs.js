// src/utils/fallbackRPCs.js
"use client";

import networks from "@/data/networks";

/**
 * Build a map: chainId → rpcUrls[]
 * entirely from your single source of truth (data/networks.js).
 */
export const ethersFallbackProviders: Record<number, string[]> = {};

// Loop through every network & its optional testnet
for (const net of networks) {
  // mainnet
  if (Array.isArray(net.rpcUrls) && net.rpcUrls.length) {
    // clone array so we never accidentally mutate the original
    ethersFallbackProviders[net.chainId] = [...net.rpcUrls];
  }

  // testnet (if present)
  if (
    net.testnet &&
    Array.isArray(net.testnet.rpcUrls) &&
    net.testnet.rpcUrls.length
  ) {
    ethersFallbackProviders[net.testnet.chainId] = [
      ...net.testnet.rpcUrls,
    ];
  }
}
