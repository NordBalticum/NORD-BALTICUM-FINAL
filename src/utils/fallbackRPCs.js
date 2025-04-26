// src/utils/fallbackRPCs.js
"use client";

import networks from "@/data/networks";

const ANKR_KEY = process.env.NEXT_PUBLIC_ANKR_KEY;
if (!ANKR_KEY) {
  console.warn("⚠️ NEXT_PUBLIC_ANKR_KEY not set! You may hit rate limits.");
}

// One “primary” + one “secondary” per chain:
const PRIMARY = {
  eth:      `https://rpc.ankr.com/eth/${ANKR_KEY}`,
  sepolia:  `https://rpc.ankr.com/eth_sepolia/${ANKR_KEY}`,
  polygon:  `https://rpc.ankr.com/polygon/${ANKR_KEY}`,
  mumbai:   `https://rpc.ankr.com/polygon_mumbai/${ANKR_KEY}`,
  bnb:      `https://rpc.ankr.com/bsc/${ANKR_KEY}`,
  bnbt:     `https://rpc.ankr.com/bsc_testnet/${ANKR_KEY}`,
  avax:     `https://rpc.ankr.com/avalanche/${ANKR_KEY}`,
  fuji:     `https://rpc.ankr.com/avalanche_fuji/${ANKR_KEY}`,
  optimism: `https://rpc.ankr.com/optimism/${ANKR_KEY}`,
  "optimism-goerli": `https://rpc.ankr.com/optimism_goerli/${ANKR_KEY}`,
  arbitrum:         `https://rpc.ankr.com/arbitrum/${ANKR_KEY}`,
  "arbitrum-goerli":`https://rpc.ankr.com/arbitrum_goerli/${ANKR_KEY}`,
  base:      `https://rpc.ankr.com/base/${ANKR_KEY}`,
  "base-goerli": `https://rpc.ankr.com/base_goerli/${ANKR_KEY}`,
  zksync:    `https://rpc.ankr.com/zksync/${ANKR_KEY}`,
  "zksync-testnet": `https://rpc.ankr.com/zksync_testnet/${ANKR_KEY}`,
  linea:     `https://rpc.ankr.com/linea/${ANKR_KEY}`,
  "linea-testnet":  `https://rpc.ankr.com/linea_goerli/${ANKR_KEY}`,
  scroll:    `https://rpc.ankr.com/scroll/${ANKR_KEY}`,
  "scroll-testnet": `https://rpc.ankr.com/scroll_testnet/${ANKR_KEY}`,
  mantle:    `https://rpc.ankr.com/mantle/${ANKR_KEY}`,
  "mantle-testnet": `https://rpc.ankr.com/mantle_testnet/${ANKR_KEY}`,
  celo:      `https://rpc.ankr.com/celo/${ANKR_KEY}`,
  alfajores: `https://rpc.ankr.com/celo_alfajores/${ANKR_KEY}`,
  gnosis:    `https://rpc.ankr.com/xdai/${ANKR_KEY}`,
  chiado:    `https://rpc.ankr.com/gnosis_chiado/${ANKR_KEY}`,
};

const SECONDARY = {
  eth:             "https://cloudflare-eth.com",
  sepolia:         "https://sepolia.publicnode.com",
  polygon:         "https://polygon-rpc.com",
  mumbai:          "https://rpc-mumbai.maticvigil.com",
  bnb:             "https://bsc-dataseed.binance.org",
  bnbt:            "https://bsc-testnet.publicnode.com",
  avax:            "https://api.avax.network/ext/bc/C/rpc",
  fuji:            "https://avalanche-fuji.publicnode.com",
  optimism:        "https://mainnet.optimism.io",
  "optimism-goerli":"https://optimism-goerli.publicnode.com",
  arbitrum:        "https://arb1.arbitrum.io/rpc",
  "arbitrum-goerli":"https://goerli-rollup.arbitrum.io/rpc",
  base:            "https://base-mainnet.public.blastapi.io",
  "base-goerli":   "https://goerli.base.org",
  zksync:          "https://mainnet.era.zksync.io",
  "zksync-testnet":"https://testnet.era.zksync.dev",
  linea:           "https://rpc.linea.build",
  "linea-testnet": "https://rpc.goerli.linea.build",
  scroll:          "https://scroll.io/l2",
  "scroll-testnet":"https://scroll-testnet.public.blastapi.io",
  mantle:          "https://rpc.mantle.xyz",
  "mantle-testnet":"https://rpc.testnet.mantle.xyz",
  celo:            "https://forno.celo.org",
  alfajores:       "https://alfajores-forno.celo-testnet.org",
  gnosis:          "https://rpc.gnosischain.com",
  chiado:          "https://rpc.chiadochain.net",
};

export const ethersFallbackProviders = {};

for (const net of networks) {
  // mainnet
  const p1 = PRIMARY[net.value];
  const p2 = SECONDARY[net.value];
  ethersFallbackProviders[net.chainId] = [p1 || p2].filter(Boolean);

  // testnet
  if (net.testnet) {
    const t1 = PRIMARY[net.testnet.value];
    const t2 = SECONDARY[net.testnet.value];
    ethersFallbackProviders[net.testnet.chainId] = [t1 || t2].filter(Boolean);
  }
}
