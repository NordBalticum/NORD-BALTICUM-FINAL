"use client";

import networks from "@/data/networks";

/**
 * fallback RPC URLs for each chainId
 */

export const ethersFallbackProviders = {};

const rpcUrls = {
  eth: [
    "https://eth-mainnet.public.blastapi.io",
    "https://rpc.ankr.com/eth",
    "https://cloudflare-eth.com"
  ],
  sepolia: [
    "https://rpc.sepolia.org",
    "https://rpc.ankr.com/eth_sepolia",
    "https://sepolia.publicnode.com"
  ],
  polygon: [
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
    "https://polygon-bor.publicnode.com"
  ],
  mumbai: [
    "https://matic-mumbai.chainstacklabs.com",
    "https://rpc.ankr.com/polygon_mumbai",
    "https://rpc-mumbai.maticvigil.com"
  ],
  bnb: [
    "https://bsc-dataseed.binance.org",
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com"
  ],
  bnbt: [
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
    "https://rpc.ankr.com/bsc_testnet",
    "https://bsc-testnet.publicnode.com"
  ],
  avax: [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche",
    "https://avalanche.publicnode.com"
  ],
  fuji: [
    "https://api.avax-test.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche_fuji",
    "https://avalanche-fuji.publicnode.com"
  ],
  optimism: [
    "https://mainnet.optimism.io",
    "https://rpc.ankr.com/optimism",
    "https://optimism.publicnode.com"
  ],
  "optimism-goerli": [
    "https://goerli.optimism.io",
    "https://rpc.ankr.com/optimism_goerli",
    "https://optimism-goerli.publicnode.com"
  ],
  arbitrum: [
    "https://arb1.arbitrum.io/rpc",
    "https://rpc.ankr.com/arbitrum",
    "https://arbitrum.publicnode.com"
  ],
  "arbitrum-goerli": [
    "https://goerli-rollup.arbitrum.io/rpc",
    "https://rpc.ankr.com/arbitrum_goerli",
    "https://arbitrum-goerli.publicnode.com"
  ],
  base: [
    "https://base-mainnet.public.blastapi.io",
    "https://rpc.ankr.com/base",
    "https://base.publicnode.com"
  ],
  "base-goerli": [
    "https://goerli.base.org",
    "https://rpc.ankr.com/base_goerli",
    "https://base-goerli.publicnode.com"
  ],
  zksync: [
    "https://mainnet.era.zksync.io",
    "https://rpc.ankr.com/zksync",
    "https://zksync.publicnode.com"
  ],
  "zksync-testnet": [
    "https://testnet.era.zksync.dev",
    "https://rpc.ankr.com/zksync_testnet",
    "https://zksync-testnet.publicnode.com"
  ],
  linea: [
    "https://rpc.linea.build",
    "https://rpc.ankr.com/linea",
    "https://linea.publicnode.com"
  ],
  "linea-testnet": [
    "https://rpc.goerli.linea.build",
    "https://rpc.ankr.com/linea_goerli",
    "https://linea-goerli.publicnode.com"
  ],
  scroll: [
    "https://scroll.io/l2",
    "https://rpc.ankr.com/scroll",
    "https://scroll.publicnode.com"
  ],
  "scroll-testnet": [
    "https://scroll-testnet.public.blastapi.io",
    "https://rpc.ankr.com/scroll_testnet",
    "https://scroll-testnet.publicnode.com"
  ],
  mantle: [
    "https://rpc.mantle.xyz",
    "https://rpc.ankr.com/mantle",
    "https://mantle.publicnode.com"
  ],
  "mantle-testnet": [
    "https://rpc.testnet.mantle.xyz",
    "https://rpc.ankr.com/mantle_testnet",
    "https://mantle-testnet.publicnode.com"
  ],
  celo: [
    "https://forno.celo.org",
    "https://rpc.ankr.com/celo",
    "https://celo.publicnode.com"
  ],
  alfajores: [
    "https://alfajores-forno.celo-testnet.org",
    "https://rpc.ankr.com/celo_alfajores",
    "https://alfajores.publicnode.com"
  ],
  gnosis: [
    "https://rpc.gnosischain.com",
    "https://rpc.ankr.com/xdai",
    "https://gnosis.publicnode.com"
  ],
  chiado: [
    "https://rpc.chiadochain.net",
    "https://rpc.ankr.com/gnosis_chiado",
    "https://chiado.publicnode.com"
  ]
};

// Automatinis sujungimas
for (const network of networks) {
  if (network.chainId && rpcUrls[network.value]) {
    ethersFallbackProviders[network.chainId] = rpcUrls[network.value];
  }
  if (network.testnet && rpcUrls[network.testnet.value]) {
    ethersFallbackProviders[network.testnet.chainId] = rpcUrls[network.testnet.value];
  }
}
