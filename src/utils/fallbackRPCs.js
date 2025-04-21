"use client";

/**
 * 🧱 Fallback RPC sąrašas pagal chainId
 */
export const ethersFallbackProviders = {
  1: [ // Ethereum Mainnet
    "https://rpc.ankr.com/eth",
    "https://eth-mainnet.public.blastapi.io",
    "https://cloudflare-eth.com"
  ],
  137: [ // Polygon
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
    "https://polygon-bor.publicnode.com"
  ],
  56: [ // Binance Smart Chain
    "https://bsc-dataseed.binance.org",
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com"
  ],
  43114: [ // Avalanche C-Chain
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche",
    "https://avalanche.publicnode.com"
  ],
  10: [ // Optimism
    "https://mainnet.optimism.io",
    "https://optimism.publicnode.com",
    "https://rpc.ankr.com/optimism"
  ],
};
