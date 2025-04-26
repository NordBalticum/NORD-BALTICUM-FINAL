"use client";

import { JsonRpcProvider, FallbackProvider } from "ethers";

export const fallbackRPCs = {
  eth: {
    key: "eth",
    label: "Ethereum",
    icon: "/icons/eth.svg",
    chainId: 1,
    isTestnet: false,
    rpcs: [
      "https://eth.llamarpc.com",
      "https://rpc.ankr.com/eth",
      "https://rpc.ethernode.io",
    ],
  },
  matic: {
    key: "matic",
    label: "Polygon",
    icon: "/icons/polygon.svg",
    chainId: 137,
    isTestnet: false,
    rpcs: [
      "https://polygon.llamarpc.com",
      "https://rpc.ankr.com/polygon",
      "https://polygon-bor.publicnode.com",
    ],
  },
  bnb: {
    key: "bnb",
    label: "BNB Chain",
    icon: "/icons/bnb.svg",
    chainId: 56,
    isTestnet: false,
    rpcs: [
      "https://bsc.publicnode.com",
      "https://rpc.ankr.com/bsc",
      "https://bsc-dataseed.bnbchain.org",
    ],
  },
  avax: {
    key: "avax",
    label: "Avalanche",
    icon: "/icons/avax.svg",
    chainId: 43114,
    isTestnet: false,
    rpcs: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://rpc.ankr.com/avalanche",
      "https://avax.public-rpc.com",
    ],
  },
  optimism: {
    key: "optimism",
    label: "Optimism",
    icon: "/icons/optimism.svg",
    chainId: 10,
    isTestnet: false,
    rpcs: [
      "https://optimism.publicnode.com",
      "https://rpc.ankr.com/optimism",
      "https://optimism-mainnet.public.blastapi.io",
    ],
  },
  arbitrum: {
    key: "arbitrum",
    label: "Arbitrum",
    icon: "/icons/arbitrum.svg",
    chainId: 42161,
    isTestnet: false,
    rpcs: [
      "https://arb1.arbitrum.io/rpc",
      "https://rpc.ankr.com/arbitrum",
      "https://arbitrum-one.publicnode.com",
    ],
  },
  base: {
    key: "base",
    label: "Base",
    icon: "/icons/base.svg",
    chainId: 8453,
    isTestnet: false,
    rpcs: [
      "https://mainnet.base.org",
      "https://developer-access-mainnet.base.org",
      "https://base.llamarpc.com",
    ],
  },
  sepolia: {
    key: "sepolia",
    label: "Sepolia",
    icon: "/icons/eth.svg",
    chainId: 11155111,
    isTestnet: true,
    rpcs: [
      "https://ethereum-sepolia.publicnode.com",
      "https://rpc.sepolia.dev",
    ],
  },
  mumbai: {
    key: "mumbai",
    label: "Mumbai",
    icon: "/icons/polygon.svg",
    chainId: 80001,
    isTestnet: true,
    rpcs: [
      "https://polygon-mumbai.publicnode.com",
      "https://rpc-mumbai.matic.today",
    ],
  },
  tbnb: {
    key: "tbnb",
    label: "BNB Testnet",
    icon: "/icons/bnb.svg",
    chainId: 97,
    isTestnet: true,
    rpcs: [
      "https://bsc-testnet.publicnode.com",
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
    ],
  },
  fuji: {
    key: "fuji",
    label: "Avalanche Fuji",
    icon: "/icons/avax.svg",
    chainId: 43113,
    isTestnet: true,
    rpcs: [
      "https://avalanche-fuji-c-chain.publicnode.com",
      "https://api.avax-test.network/ext/bc/C/rpc",
    ],
  },
  "optimism-goerli": {
    key: "optimism-goerli",
    label: "Optimism Goerli",
    icon: "/icons/optimism.svg",
    chainId: 420,
    isTestnet: true,
    rpcs: [
      "https://optimism-goerli.publicnode.com",
      "https://goerli.optimism.io",
    ],
  },
  "arbitrum-goerli": {
    key: "arbitrum-goerli",
    label: "Arbitrum Goerli",
    icon: "/icons/arbitrum.svg",
    chainId: 421613,
    isTestnet: true,
    rpcs: [
      "https://arbitrum-goerli.publicnode.com",
      "https://goerli-rollup.arbitrum.io/rpc",
    ],
  },
  "base-goerli": {
    key: "base-goerli",
    label: "Base Goerli",
    icon: "/icons/base.svg",
    chainId: 84531,
    isTestnet: true,
    rpcs: [
      "https://base-goerli.publicnode.com",
      "https://goerli.base.org",
    ],
  },
};

export function getFallbackProvider(chainKey) {
  const net = fallbackRPCs[chainKey];
  if (!net || !net.rpcs || net.rpcs.length === 0) {
    console.error(`[fallbackRPCs] ❌ No RPC URLs found for chain: ${chainKey}`);
    throw new Error(`No fallback RPCs found for chain "${chainKey}".`);
  }
  const providers = net.rpcs.map(url => new JsonRpcProvider(url));
  return new FallbackProvider(providers);
}

export default fallbackRPCs;
