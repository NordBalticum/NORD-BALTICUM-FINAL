// src/data/networks.js
"use client";

const ANKR_KEY = process.env.NEXT_PUBLIC_ANKR_KEY || ""; // kept for backwards‐compat if you really need it

// helper — include Ankr only if you really want a 3rd fallback
const maybeAnkr = (path) =>
  ANKR_KEY ? `https://rpc.ankr.com/${path}?apikey=${ANKR_KEY}` : null;

export default [
  {
    label: "Ethereum",
    value: "eth",
    chainId: 1,
    icon: "/icons/eth.svg",
    rpcUrls: [
      "https://cloudflare-eth.com",      // public‐first
      "https://1rpc.io/eth",             // 1RPC secondary
      // maybeAnkr("eth")
    ].filter(Boolean),
    testnet: {
      label: "Sepolia",
      value: "sepolia",
      chainId: 11155111,
      icon: "/icons/eth.svg",
      rpcUrls: [
        "https://sepolia.publicnode.com",
        "https://1rpc.io/sepolia",
        // maybeAnkr("eth_sepolia")
      ].filter(Boolean),
    },
  },
  {
    label: "Polygon",
    value: "matic",
    chainId: 137,
    icon: "/icons/matic.svg",
    rpcUrls: [
      "https://polygon-rpc.com",
      "https://1rpc.io/polygon",
      // maybeAnkr("polygon")
    ].filter(Boolean),
    testnet: {
      label: "Mumbai",
      value: "mumbai",
      chainId: 80001,
      icon: "/icons/matic.svg",
      rpcUrls: [
        "https://rpc-mumbai.maticvigil.com",
        "https://1rpc.io/mumbai",
        // maybeAnkr("polygon_mumbai")
      ].filter(Boolean),
    },
  },
  {
    label: "BNB Chain",
    value: "bnb",
    chainId: 56,
    icon: "/icons/bnb.svg",
    rpcUrls: [
      "https://bsc-dataseed.binance.org",
      "https://1rpc.io/bsc",
      // maybeAnkr("bsc")
    ].filter(Boolean),
    testnet: {
      label: "BNB Testnet",
      value: "tbnb",
      chainId: 97,
      icon: "/icons/bnb.svg",
      rpcUrls: [
        "https://bsc-testnet.publicnode.com",
        "https://1rpc.io/bsc-testnet",
        // maybeAnkr("bsc_testnet")
      ].filter(Boolean),
    },
  },
  {
    label: "Avalanche",
    value: "avax",
    chainId: 43114,
    icon: "/icons/avax.svg",
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://1rpc.io/avax",
      // maybeAnkr("avalanche")
    ].filter(Boolean),
    testnet: {
      label: "Fuji",
      value: "fuji",
      chainId: 43113,
      icon: "/icons/avax.svg",
      rpcUrls: [
        "https://avalanche-fuji.publicnode.com",
        "https://api.avax-test.network/ext/bc/C/rpc",
        // maybeAnkr("avalanche_fuji")
      ].filter(Boolean),
    },
  },
  {
    label: "Optimism",
    value: "optimism",
    chainId: 10,
    icon: "/icons/optimism.svg",
    rpcUrls: [
      "https://mainnet.optimism.io",
      "https://1rpc.io/optimism",
      // maybeAnkr("optimism")
    ].filter(Boolean),
    testnet: {
      label: "Optimism Goerli",
      value: "optimism-goerli",
      chainId: 420,
      icon: "/icons/optimism.svg",
      rpcUrls: [
        "https://optimism-goerli.publicnode.com",
        "https://1rpc.io/optimism-goerli",
        // maybeAnkr("optimism_goerli")
      ].filter(Boolean),
    },
  },
  {
    label: "Arbitrum One",
    value: "arbitrum",
    chainId: 42161,
    icon: "/icons/arbitrum.svg",
    rpcUrls: [
      "https://arb1.arbitrum.io/rpc",
      "https://1rpc.io/arbitrum",
      // maybeAnkr("arbitrum")
    ].filter(Boolean),
    testnet: {
      label: "Arbitrum Goerli",
      value: "arbitrum-goerli",
      chainId: 421613,
      icon: "/icons/arbitrum.svg",
      rpcUrls: [
        "https://goerli-rollup.arbitrum.io/rpc",
        "https://1rpc.io/arbitrum-goerli",
        // maybeAnkr("arbitrum_goerli")
      ].filter(Boolean),
    },
  },
  {
    label: "Base",
    value: "base",
    chainId: 8453,
    icon: "/icons/base.svg",
    rpcUrls: [
      "https://base-mainnet.public.blastapi.io",
      "https://1rpc.io/base",
      // maybeAnkr("base")
    ].filter(Boolean),
    testnet: {
      label: "Base Goerli",
      value: "base-goerli",
      chainId: 84531,
      icon: "/icons/base.svg",
      rpcUrls: [
        "https://goerli.base.org",
        "https://1rpc.io/base-goerli",
        // maybeAnkr("base_goerli")
      ].filter(Boolean),
    },
  },
  {
    label: "zkSync Era",
    value: "zksync",
    chainId: 324,
    icon: "/icons/zksync.svg",
    rpcUrls: [
      "https://mainnet.era.zksync.io",
      "https://1rpc.io/zksync",
      // maybeAnkr("zksync")
    ].filter(Boolean),
    testnet: {
      label: "zkSync Testnet",
      value: "zksync-testnet",
      chainId: 280,
      icon: "/icons/zksync.svg",
      rpcUrls: [
        "https://testnet.era.zksync.dev",
        "https://1rpc.io/zksync-testnet",
        // maybeAnkr("zksync_testnet")
      ].filter(Boolean),
    },
  },
  {
    label: "Linea",
    value: "linea",
    chainId: 59144,
    icon: "/icons/linea.svg",
    rpcUrls: [
      "https://rpc.linea.build",
      "https://1rpc.io/linea",
      // maybeAnkr("linea")
    ].filter(Boolean),
    testnet: {
      label: "Linea Testnet",
      value: "linea-testnet",
      chainId: 59140,
      icon: "/icons/linea.svg",
      rpcUrls: [
        "https://rpc.goerli.linea.build",
        "https://1rpc.io/linea-testnet",
        // maybeAnkr("linea_goerli")
      ].filter(Boolean),
    },
  },
  {
    label: "Scroll",
    value: "scroll",
    chainId: 534352,
    icon: "/icons/scroll.svg",
    rpcUrls: [
      "https://scroll.io/l2",
      "https://1rpc.io/scroll",
      // maybeAnkr("scroll")
    ].filter(Boolean),
    testnet: {
      label: "Scroll Testnet",
      value: "scroll-testnet",
      chainId: 534353,
      icon: "/icons/scroll.svg",
      rpcUrls: [
        "https://scroll-testnet.public.blastapi.io",
        "https://1rpc.io/scroll-testnet",
        // maybeAnkr("scroll_testnet")
      ].filter(Boolean),
    },
  },
  {
    label: "Mantle",
    value: "mantle",
    chainId: 5000,
    icon: "/icons/mantle.svg",
    rpcUrls: [
      "https://rpc.mantle.xyz",
      "https://1rpc.io/mantle",
      // maybeAnkr("mantle")
    ].filter(Boolean),
    testnet: {
      label: "Mantle Testnet",
      value: "mantle-testnet",
      chainId: 5001,
      icon: "/icons/mantle.svg",
      rpcUrls: [
        "https://rpc.testnet.mantle.xyz",
        "https://1rpc.io/mantle-testnet",
        // maybeAnkr("mantle_testnet")
      ].filter(Boolean),
    },
  },
  {
    label: "Celo",
    value: "celo",
    chainId: 42220,
    icon: "/icons/celo.svg",
    rpcUrls: [
      "https://forno.celo.org",
      "https://1rpc.io/celo",
      // maybeAnkr("celo")
    ].filter(Boolean),
    testnet: {
      label: "Alfajores",
      value: "alfajores",
      chainId: 44787,
      icon: "/icons/celo.svg",
      rpcUrls: [
        "https://alfajores-forno.celo-testnet.org",
        "https://1rpc.io/alfajores",
        // maybeAnkr("celo_alfajores")
      ].filter(Boolean),
    },
  },
  {
    label: "Gnosis Chain",
    value: "gnosis",
    chainId: 100,
    icon: "/icons/gnosis.svg",
    rpcUrls: [
      "https://rpc.gnosischain.com",
      "https://1rpc.io/xdai",
      // maybeAnkr("xdai")
    ].filter(Boolean),
    testnet: {
      label: "Chiado",
      value: "chiado",
      chainId: 10200,
      icon: "/icons/gnosis.svg",
      rpcUrls: [
        "https://rpc.chiadochain.net",
        "https://1rpc.io/chiado",
        // maybeAnkr("gnosis_chiado")
      ].filter(Boolean),
    },
  },
];
