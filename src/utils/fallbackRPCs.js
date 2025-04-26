// src/utils/fallbackRPCs.js
"use client";

/**
 * A map of chainId → [RPC URLs…].
 * 1️⃣ Official/public RPC
 * 2️⃣ Your Ankr endpoint (with API key)
 * 3️⃣ PublicNode (or other fallback)
 */
export const ethersFallbackProviders = {
  // Ethereum
  1: [
    "https://eth-mainnet.public.blastapi.io",
    "https://rpc.ankr.com/eth",
    "https://cloudflare-eth.com"
  ],
  11155111: [
    "https://rpc.sepolia.org",
    "https://rpc.ankr.com/eth_sepolia",
    "https://sepolia.publicnode.com"
  ],

  // Polygon
  137: [
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
    "https://polygon-bor.publicnode.com"
  ],
  80001: [
    "https://matic-mumbai.chainstacklabs.com",
    "https://rpc.ankr.com/polygon_mumbai",
    "https://rpc-mumbai.maticvigil.com"
  ],

  // BNB Chain
  56: [
    "https://bsc-dataseed.binance.org",
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com"
  ],
  97: [
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
    "https://rpc.ankr.com/bsc_testnet",
    "https://bsc-testnet.publicnode.com"
  ],

  // Avalanche
  43114: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche",
    "https://avalanche.publicnode.com"
  ],
  43113: [
    "https://api.avax-test.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche_fuji",
    "https://avalanche-fuji.publicnode.com"
  ],

  // Optimism
  10: [
    "https://mainnet.optimism.io",
    "https://rpc.ankr.com/optimism",
    "https://optimism.publicnode.com"
  ],
  420: [
    "https://goerli.optimism.io",
    "https://rpc.ankr.com/optimism_goerli",
    "https://optimism-goerli.publicnode.com"
  ],

  // Arbitrum
  42161: [
    "https://arb1.arbitrum.io/rpc",
    "https://rpc.ankr.com/arbitrum",
    "https://arbitrum.publicnode.com"
  ],
  421613: [
    "https://goerli-rollup.arbitrum.io/rpc",
    "https://rpc.ankr.com/arbitrum_goerli",
    "https://arbitrum-goerli.publicnode.com"
  ],

  // Base
  8453: [
    "https://base-mainnet.public.blastapi.io",
    "https://rpc.ankr.com/base",
    "https://base.publicnode.com"
  ],
  84531: [
    "https://goerli.base.org",
    "https://rpc.ankr.com/base_goerli",
    "https://base-goerli.publicnode.com"
  ],

  // zkSync Era
  324: [
    "https://mainnet.era.zksync.io",
    "https://rpc.ankr.com/zksync",
    "https://zksync.publicnode.com"
  ],
  280: [
    "https://testnet.era.zksync.dev",
    "https://rpc.ankr.com/zksync_testnet",
    "https://zksync-testnet.publicnode.com"
  ],

  // Linea
  59144: [
    "https://rpc.linea.build",
    "https://rpc.ankr.com/linea",
    "https://linea.publicnode.com"
  ],
  59140: [
    "https://rpc.goerli.linea.build",
    "https://rpc.ankr.com/linea_goerli",
    "https://linea-goerli.publicnode.com"
  ],

  // Scroll
  534352: [
    "https://scroll.io/l2",
    "https://rpc.ankr.com/scroll",
    "https://scroll.publicnode.com"
  ],
  534353: [
    "https://scroll-testnet.public.blastapi.io",
    "https://rpc.ankr.com/scroll_testnet",
    "https://scroll-testnet.publicnode.com"
  ],

  // Mantle
  5000: [
    "https://rpc.mantle.xyz",
    "https://rpc.ankr.com/mantle",
    "https://mantle.publicnode.com"
  ],
  5001: [
    "https://rpc.testnet.mantle.xyz",
    "https://rpc.ankr.com/mantle_testnet",
    "https://mantle-testnet.publicnode.com"
  ],

  // Celo
  42220: [
    "https://forno.celo.org",
    "https://rpc.ankr.com/celo",
    "https://celo.publicnode.com"
  ],
  44787: [
    "https://alfajores-forno.celo-testnet.org",
    "https://rpc.ankr.com/celo_alfajores",
    "https://alfajores.publicnode.com"
  ],

  // Gnosis Chain
  100: [
    "https://rpc.gnosischain.com",
    "https://rpc.ankr.com/xdai",
    "https://gnosis.publicnode.com"
  ],
  10200: [
    "https://rpc.chiadochain.net",
    "https://rpc.ankr.com/gnosis_chiado",
    "https://chiado.publicnode.com"
  ]
};
