// src/utils/fallbackRPCs.js
"use client";

export const ethersFallbackProviders = {
  1: [ // Ethereum Mainnet
    "https://rpc.ankr.com/eth",
    "https://eth-mainnet.public.blastapi.io",
    "https://cloudflare-eth.com"
  ],
  56: [ // BSC Mainnet
    "https://bsc-dataseed.binance.org",
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com"
  ],
  97: [ // BSC Testnet (tbnb)
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
    "https://bsc-testnet.public.blastapi.io"
  ],
  137: [ // Polygon Mainnet (matic)
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon/00940a4dee2134e7daf2c8353848d8b589047754a616e34648dac039440c9f98",
    "https://polygon-bor.publicnode.com"
  ],
  43114: [ // Avalanche C-Chain
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche",
    "https://avalanche.publicnode.com"
  ],
};
