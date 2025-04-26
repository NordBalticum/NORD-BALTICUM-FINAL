// src/utils/fallbackRPCs.js
"use client";

import networks from "@/data/networks";

const ANKR_KEY = process.env.NEXT_PUBLIC_ANKR_KEY;
if (!ANKR_KEY) {
  console.warn("⚠️ NEXT_PUBLIC_ANKR_KEY not set — you may hit rate limits.");
}

// Build up chainId → [ rpcUrl ] map:
export const ethersFallbackProviders = {};

for (const net of networks) {
  // mainnet URL with optional ?apikey=
  const main = `https://rpc.ankr.com/${net.value}` +
               (ANKR_KEY ? `?apikey=${ANKR_KEY}` : "");
  ethersFallbackProviders[ net.chainId ] = [ main ];

  // testnet, if defined
  if (net.testnet) {
    const test = `https://rpc.ankr.com/${net.testnet.value}` +
                 (ANKR_KEY ? `?apikey=${ANKR_KEY}` : "");
    ethersFallbackProviders[ net.testnet.chainId ] = [ test ];
  }
}
