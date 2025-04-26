// src/utils/fallbackRPCs.js
import { JsonRpcProvider, FallbackProvider } from "ethers";

export const fallbackRPCs = {
  eth: {
    key: "eth",
    label: "Ethereum",
    icon: "/icons/eth.svg",
    chainId: 1,
    isTestnet: false,
    rpcs: [
      "https://rpc.ankr.com/eth",
      "https://eth.drpc.org",
      "https://ethereum.publicnode.com",
    ],
  },
  matic: {
    key: "matic",
    label: "Polygon",
    icon: "/icons/polygon.svg",
    chainId: 137,
    isTestnet: false,
    rpcs: [
      "https://rpc.ankr.com/polygon",
      "https://polygon-bor.publicnode.com",
      "https://polygon.drpc.org",
    ],
  },
  bnb: {
    key: "bnb",
    label: "BNB Chain",
    icon: "/icons/bnb.svg",
    chainId: 56,
    isTestnet: false,
    rpcs: [
      "https://rpc.ankr.com/bsc",
      "https://bsc-dataseed.bnbchain.org",
      "https://bsc.publicnode.com",
    ],
  },
  avax: {
    key: "avax",
    label: "Avalanche",
    icon: "/icons/avax.svg",
    chainId: 43114,
    isTestnet: false,
    rpcs: [
      "https://rpc.ankr.com/avalanche",
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avax.drpc.org",
    ],
  },
  optimism: {
    key: "optimism",
    label: "Optimism",
    icon: "/icons/optimism.svg",
    chainId: 10,
    isTestnet: false,
    rpcs: [
      "https://rpc.ankr.com/optimism",
      "https://optimism.drpc.org",
      "https://optimism.publicnode.com",
    ],
  },
  arbitrum: {
    key: "arbitrum",
    label: "Arbitrum",
    icon: "/icons/arbitrum.svg",
    chainId: 42161,
    isTestnet: false,
    rpcs: [
      "https://rpc.ankr.com/arbitrum",
      "https://arbitrum.drpc.org",
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
      "https://developer-access-mainnet.base.org",
      "https://mainnet.base.org",
      "https://base.drpc.org",
    ],
  },
  sepolia: {
    key: "sepolia",
    label: "Sepolia",
    icon: "/icons/eth.svg",
    chainId: 11155111,
    isTestnet: true,
    rpcs: [
      "https://rpc.sepolia.org",
      "https://sepolia.drpc.org",
      "https://ethereum-sepolia.publicnode.com",
    ],
  },
  mumbai: {
    key: "mumbai",
    label: "Mumbai",
    icon: "/icons/polygon.svg",
    chainId: 80001,
    isTestnet: true,
    rpcs: [
      "https://rpc-mumbai.maticvigil.com",
      "https://rpc.ankr.com/polygon_mumbai",
      "https://polygon-mumbai-bor.publicnode.com",
    ],
  },
  tbnb: {
    key: "tbnb",
    label: "BNB Testnet",
    icon: "/icons/bnb.svg",
    chainId: 97,
    isTestnet: true,
    rpcs: [
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
      "https://bsc-testnet.publicnode.com",
      "https://rpc.ankr.com/bsc_testnet_chapel",
    ],
  },
  fuji: {
    key: "fuji",
    label: "Avalanche Fuji",
    icon: "/icons/avax.svg",
    chainId: 43113,
    isTestnet: true,
    rpcs: [
      "https://api.avax-test.network/ext/bc/C/rpc",
      "https://avalanche-fuji-c-chain.publicnode.com",
      "https://avalanche-fuji.drpc.org",
    ],
  },
  "optimism-goerli": {
    key: "optimism-goerli",
    label: "Optimism Goerli",
    icon: "/icons/optimism.svg",
    chainId: 420,
    isTestnet: true,
    rpcs: [
      "https://goerli.optimism.io",
      "https://optimism-goerli.publicnode.com",
      "https://optimism-goerli.drpc.org",
    ],
  },
  "arbitrum-goerli": {
    key: "arbitrum-goerli",
    label: "Arbitrum Goerli",
    icon: "/icons/arbitrum.svg",
    chainId: 421613,
    isTestnet: true,
    rpcs: [
      "https://goerli-rollup.arbitrum.io/rpc",
      "https://arbitrum-goerli.publicnode.com",
      "https://arbitrum-goerli.drpc.org",
    ],
  },
  "base-goerli": {
    key: "base-goerli",
    label: "Base Goerli",
    icon: "/icons/base.svg",
    chainId: 84531,
    isTestnet: true,
    rpcs: [
      "https://goerli.base.org",
      "https://base-goerli.drpc.org",
      "https://base-goerli.publicnode.com",
    ],
  },
};

export function getFallbackProvider(chain) {
  const net = fallbackRPCs[chain];
  if (!net || !net.rpcs || net.rpcs.length === 0) {
    console.error(`[fallbackRPCs] ❌ No RPC URLs found for chain: ${chain}`);
    throw new Error(`No RPC URLs for chain ${chain}`);
  }
  const providers = net.rpcs.map(url => new JsonRpcProvider(url));
  return new FallbackProvider(providers);
}

export default fallbackRPCs;
