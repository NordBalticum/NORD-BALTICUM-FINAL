// src/utils/fallbackRPCs.js
"use client";

import networks from "@/data/networks";

/**
 * Build a map: chainId → rpcUrls[]
 * entirely from your single source of truth (data/networks.js).
 */
export const ethersFallbackProviders = {};

for (const net of networks) {
  if (Array.isArray(net.rpcUrls) && net.rpcUrls.length) {
    ethersFallbackProviders[net.chainId] = net.rpcUrls;
  }
  if (net.testnet && Array.isArray(net.testnet.rpcUrls) && net.testnet.rpcUrls.length) {
    ethersFallbackProviders[net.testnet.chainId] = net.testnet.rpcUrls;
  }
}
