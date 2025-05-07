// src/utils/fallbackRPCs.js

import { JsonRpcProvider, FallbackProvider, ethers } from "ethers";

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
  matic: {
    key: "matic",
    label: "Polygon",
    icon: "/icons/matic.svg",
    chainId: 137,
    isTestnet: false,
    rpcs: [
      "https://rpc.ankr.com/polygon",
      "https://polygon-bor.publicnode.com",
      "https://polygon.drpc.org",
    ],
  },
  mumbai: {
    key: "mumbai",
    label: "Mumbai",
    icon: "/icons/matic.svg",
    chainId: 80001,
    isTestnet: true,
    rpcs: [
      "https://rpc.ankr.com/polygon_mumbai",
      "https://rpc-mumbai.maticvigil.com",
      "https://polygon-mumbai-bor.publicnode.com",
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
  tbnb: {
    key: "tbnb",
    label: "BNB Testnet",
    icon: "/icons/bnb.svg",
    chainId: 97,
    isTestnet: true,
    rpcs: [
      "https://bsc-testnet.publicnode.com",
      "https://data-seed-prebsc-1-s1.binance.org:8545",
      "https://rpc.ankr.com/bsc_testnet_chapel",
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
  fuji: {
    key: "fuji",
    label: "Fuji",
    icon: "/icons/avax.svg",
    chainId: 43113,
    isTestnet: true,
    rpcs: [
      "https://api.avax-test.network/ext/bc/C/rpc",
      "https://avalanche-fuji.drpc.org",
      "https://avalanche-fuji-c-chain.publicnode.com",
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
  "optimism-goerli": {
    key: "optimism-goerli",
    label: "Optimism Goerli",
    icon: "/icons/optimism.svg",
    chainId: 420,
    isTestnet: true,
    rpcs: [
      "https://optimism-goerli.publicnode.com",
      "https://goerli.optimism.io",
      "https://optimism-goerli.drpc.org",
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
  "arbitrum-goerli": {
    key: "arbitrum-goerli",
    label: "Arbitrum Goerli",
    icon: "/icons/arbitrum.svg",
    chainId: 421613,
    isTestnet: true,
    rpcs: [
      "https://goerli-rollup.arbitrum.io/rpc",
      "https://arbitrum-goerli.drpc.org",
      "https://arbitrum-goerli.publicnode.com",
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
      "https://base.drpc.org",
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
      "https://base-goerli.publicnode.com",
      "https://base-goerli.drpc.org",
    ],
  },
  scroll: {
    key: "scroll",
    label: "Scroll",
    icon: "/icons/scroll.svg",
    chainId: 534352,
    isTestnet: false,
    rpcs: [
      "https://rpc.scroll.io",
      "https://scroll.drpc.org",
    ],
  },
  linea: {
    key: "linea",
    label: "Linea",
    icon: "/icons/linea.svg",
    chainId: 59144,
    isTestnet: false,
    rpcs: [
      "https://rpc.linea.build",
      "https://linea-mainnet.infura.io/v3",
    ],
  },
  zksync: {
    key: "zksync",
    label: "zkSync Era",
    icon: "/icons/zksync.svg",
    chainId: 324,
    isTestnet: false,
    rpcs: [
      "https://mainnet.era.zksync.io",
      "https://zksync2-mainnet.zksync.io",
    ],
  },
  mantle: {
    key: "mantle",
    label: "Mantle",
    icon: "/icons/mantle.svg",
    chainId: 5000,
    isTestnet: false,
    rpcs: [
      "https://rpc.mantle.xyz",
      "https://mantle.drpc.org",
    ],
  },
  "mantle-testnet": {
    key: "mantle-testnet",
    label: "Mantle Testnet",
    icon: "/icons/mantle.svg",
    chainId: 5001,
    isTestnet: true,
    rpcs: [
      "https://rpc.testnet.mantle.xyz",
    ],
  },
  celo: {
    key: "celo",
    label: "Celo",
    icon: "/icons/celo.svg",
    chainId: 42220,
    isTestnet: false,
    rpcs: [
      "https://forno.celo.org",
      "https://rpc.ankr.com/celo",
    ],
  },
  moonbeam: {
    key: "moonbeam",
    label: "Moonbeam",
    icon: "/icons/moonbeam.svg",
    chainId: 1284,
    isTestnet: false,
    rpcs: [
      "https://rpc.api.moonbeam.network",
      "https://moonbeam.public.blastapi.io",
    ],
  },
  aurora: {
    key: "aurora",
    label: "Aurora",
    icon: "/icons/aurora.svg",
    chainId: 1313161554,
    isTestnet: false,
    rpcs: [
      "https://mainnet.aurora.dev",
      "https://aurora-mainnet.drpc.org",
    ],
  },
  fantom: {
    key: "fantom",
    label: "Fantom",
    icon: "/icons/fantom.svg",
    chainId: 250,
    isTestnet: false,
    rpcs: [
      "https://rpc.ankr.com/fantom",
      "https://fantom.publicnode.com",
      "https://rpcapi.fantom.network",
    ],
  },
  "fantom-testnet": {
    key: "fantom-testnet",
    label: "Fantom Testnet",
    icon: "/icons/fantom.svg",
    chainId: 4002,
    isTestnet: true,
    rpcs: [
      "https://rpc.testnet.fantom.network",
    ],
  },
};

export const fallbackGasReserve = {
  1: ethers.parseEther("0.0005"),
  5: ethers.parseEther("0.0005"),
  11155111: ethers.parseEther("0.0005"),
  56: ethers.parseUnits("0.002", "ether"),
  97: ethers.parseUnits("0.002", "ether"),
  137: ethers.parseUnits("0.3", "ether"),
  80001: ethers.parseUnits("0.3", "ether"),
  43114: ethers.parseUnits("0.01", "ether"),
  43113: ethers.parseUnits("0.01", "ether"),
  10: ethers.parseEther("0.0005"),
  420: ethers.parseEther("0.0005"),
  42161: ethers.parseEther("0.0005"),
  421613: ethers.parseEther("0.0005"),
  42220: ethers.parseUnits("0.001", "ether"),
  100: ethers.parseUnits("0.001", "ether"),
  250: ethers.parseUnits("0.01", "ether"),
  4002: ethers.parseUnits("0.01", "ether"),
  8453: ethers.parseEther("0.0005"),
  84531: ethers.parseEther("0.0005"),
  324: ethers.parseUnits("0.0005", "ether"),
  534352: ethers.parseUnits("0.002", "ether"),
  59144: ethers.parseUnits("0.001", "ether"),
  5000: ethers.parseUnits("0.002", "ether"),
  5001: ethers.parseUnits("0.002", "ether"),
  1284: ethers.parseUnits("0.001", "ether"),
  1313161554: ethers.parseUnits("0.002", "ether"),
};

export function getFallbackProvider(chainKey) {
  const net = fallbackRPCs[chainKey];
  if (!net || !net.rpcs?.length) throw new Error(`❌ No RPC URLs for chain: ${chainKey}`);
  return new FallbackProvider(net.rpcs.map((url) => new JsonRpcProvider(url)));
}

export default fallbackRPCs;
