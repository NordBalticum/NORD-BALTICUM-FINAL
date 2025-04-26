// src/utils/fallbackRPCs.js
"use client";

import networks from "@/data/networks";

/**
 * Only one CORS-friendly Ankr RPC per network.
 * We build ethersFallbackProviders dynamically so your Mainnet/Testnet toggle
 * (which lives in your Dashboard & Send pages) stays 100% unchanged.
 */
const ANKR_RPC = {
  eth:                "https://rpc.ankr.com/eth",
  sepolia:            "https://rpc.ankr.com/eth_sepolia",
  polygon:            "https://rpc.ankr.com/polygon",
  mumbai:             "https://rpc.ankr.com/polygon_mumbai",
  bnb:                "https://rpc.ankr.com/bsc",
  bnbt:               "https://rpc.ankr.com/bsc_testnet",
  avax:               "https://rpc.ankr.com/avalanche",
  fuji:               "https://rpc.ankr.com/avalanche_fuji",
  optimism:           "https://rpc.ankr.com/optimism",
  "optimism-goerli":  "https://rpc.ankr.com/optimism_goerli",
  arbitrum:           "https://rpc.ankr.com/arbitrum",
  "arbitrum-goerli":  "https://rpc.ankr.com/arbitrum_goerli",
  base:               "https://rpc.ankr.com/base",
  "base-goerli":      "https://rpc.ankr.com/base_goerli",
  zksync:             "https://rpc.ankr.com/zksync",
  "zksync-testnet":   "https://rpc.ankr.com/zksync_testnet",
  linea:              "https://rpc.ankr.com/linea",
  "linea-testnet":    "https://rpc.ankr.com/linea_goerli",
  scroll:             "https://rpc.ankr.com/scroll",
  "scroll-testnet":   "https://rpc.ankr.com/scroll_testnet",
  mantle:             "https://rpc.ankr.com/mantle",
  "mantle-testnet":   "https://rpc.ankr.com/mantle_testnet",
  celo:               "https://rpc.ankr.com/celo",
  alfajores:          "https://rpc.ankr.com/celo_alfajores",
  gnosis:             "https://rpc.ankr.com/xdai",
  chiado:             "https://rpc.ankr.com/gnosis_chiado",
};

export const ethersFallbackProviders = {};

// Walk the networks array and map each mainnet + its testnet to a single Ankr URL
for (const net of networks) {
  if (ANKR_RPC[net.value]) {
    ethersFallbackProviders[net.chainId] = [ANKR_RPC[net.value]];
  }
  if (net.testnet && ANKR_RPC[net.testnet.value]) {
    ethersFallbackProviders[net.testnet.chainId] = [
      ANKR_RPC[net.testnet.value],
    ];
  }
}
