// src/utils/fallbackRPCs.js
"use client";

/**
 * 🧱 Fallback RPC endpoints by chainId
 */
export const ethersFallbackProviders = {
  1: [ // Ethereum Mainnet
    "https://rpc.ankr.com/eth",
    "https://eth-mainnet.public.blastapi.io",
    "https://cloudflare-eth.com"
  ],
  137: [ // Polygon Mainnet
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
    "https://polygon-bor.publicnode.com"
  ],
  56: [ // BSC Mainnet
    "https://bsc-dataseed.binance.org",
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com"
  ],
  43114: [ // Avalanche C-Chain
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche",
    "https://avalanche.publicnode.com"
  ],
  97: [ // BSC Testnet
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
    "https://bsc-testnet.public.blastapi.io"
  ],
};
