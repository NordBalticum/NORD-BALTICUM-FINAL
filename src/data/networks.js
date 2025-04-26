// src/data/networks.js
"use client";

const ANKR = "https://rpc.ankr.com";
const ANKR_KEY = process.env.NEXT_PUBLIC_ANKR_KEY || "";
const withAnkr = (path) =>
  ANKR_KEY
    ? `${ANKR}/${path}?apikey=${ANKR_KEY}`
    : `${ANKR}/${path}`;

export default [
  {
    label: "Ethereum",
    value: "eth",
    chainId: 1,
    icon: "/icons/eth.svg",
    min: 0.001,
    rpcUrls: [
      withAnkr("eth"),
      "https://cloudflare-eth.com",
    ],
    testnet: {
      label: "Sepolia",
      value: "sepolia",
      chainId: 11155111,
      rpcUrls: [
        withAnkr("eth_sepolia"),
        "https://sepolia.publicnode.com",
      ],
    },
  },
  {
    label: "Polygon",
    value: "matic",
    chainId: 137,
    icon: "/icons/matic.svg",
    min: 0.1,
    rpcUrls: [
      withAnkr("polygon"),
      "https://polygon-rpc.com",
    ],
    testnet: {
      label: "Mumbai",
      value: "mumbai",
      chainId: 80001,
      rpcUrls: [
        withAnkr("polygon_mumbai"),
        "https://rpc-mumbai.maticvigil.com",
      ],
    },
  },
  {
    label: "BNB Chain",
    value: "bnb",
    chainId: 56,
    icon: "/icons/bnb.svg",
    min: 0.01,
    rpcUrls: [
      withAnkr("bsc"),
      "https://bsc-dataseed.binance.org",
    ],
    testnet: {
      label: "BNB Testnet",
      value: "tbnb",
      chainId: 97,
      rpcUrls: [
        withAnkr("bsc_testnet"),
        "https://bsc-testnet.publicnode.com",
      ],
    },
  },
  {
    label: "Avalanche",
    value: "avax",
    chainId: 43114,
    icon: "/icons/avax.svg",
    min: 0.01,
    rpcUrls: [
      withAnkr("avalanche"),
      "https://api.avax.network/ext/bc/C/rpc",
    ],
    testnet: {
      label: "Fuji",
      value: "fuji",
      chainId: 43113,
      rpcUrls: [
        withAnkr("avalanche_fuji"),
        "https://avalanche-fuji.publicnode.com",
      ],
    },
  },
  {
    label: "Optimism",
    value: "optimism",
    chainId: 10,
    icon: "/icons/optimism.svg",
    min: 0.001,
    rpcUrls: [
      withAnkr("optimism"),
      "https://mainnet.optimism.io",
    ],
    testnet: {
      label: "Optimism Goerli",
      value: "optimism-goerli",
      chainId: 420,
      rpcUrls: [
        withAnkr("optimism_goerli"),
        "https://optimism-goerli.publicnode.com",
      ],
    },
  },
  {
    label: "Arbitrum One",
    value: "arbitrum",
    chainId: 42161,
    icon: "/icons/arbitrum.svg",
    min: 0.001,
    rpcUrls: [
      withAnkr("arbitrum"),
      "https://arb1.arbitrum.io/rpc",
    ],
    testnet: {
      label: "Arbitrum Goerli",
      value: "arbitrum-goerli",
      chainId: 421613,
      rpcUrls: [
        withAnkr("arbitrum_goerli"),
        "https://goerli-rollup.arbitrum.io/rpc",
      ],
    },
  },
  {
    label: "Base",
    value: "base",
    chainId: 8453,
    icon: "/icons/base.svg",
    min: 0.001,
    rpcUrls: [
      withAnkr("base"),
      "https://base-mainnet.public.blastapi.io",
    ],
    testnet: {
      label: "Base Goerli",
      value: "base-goerli",
      chainId: 84531,
      rpcUrls: [
        withAnkr("base_goerli"),
        "https://goerli.base.org",
      ],
    },
  },
  {
    label: "zkSync Era",
    value: "zksync",
    chainId: 324,
    icon: "/icons/zksync.svg",
    min: 0.001,
    rpcUrls: [
      withAnkr("zksync"),
      "https://mainnet.era.zksync.io",
    ],
    testnet: {
      label: "zkSync Testnet",
      value: "zksync-testnet",
      chainId: 280,
      rpcUrls: [
        withAnkr("zksync_testnet"),
        "https://testnet.era.zksync.dev",
      ],
    },
  },
  {
    label: "Linea",
    value: "linea",
    chainId: 59144,
    icon: "/icons/linea.svg",
    min: 0.001,
    rpcUrls: [
      withAnkr("linea"),
      "https://rpc.linea.build",
    ],
    testnet: {
      label: "Linea Testnet",
      value: "linea-testnet",
      chainId: 59140,
      rpcUrls: [
        withAnkr("linea_goerli"),
        "https://rpc.goerli.linea.build",
      ],
    },
  },
  {
    label: "Scroll",
    value: "scroll",
    chainId: 534352,
    icon: "/icons/scroll.svg",
    min: 0.001,
    rpcUrls: [
      withAnkr("scroll"),
      "https://scroll.io/l2",
    ],
    testnet: {
      label: "Scroll Testnet",
      value: "scroll-testnet",
      chainId: 534353,
      rpcUrls: [
        withAnkr("scroll_testnet"),
        "https://scroll-testnet.public.blastapi.io",
      ],
    },
  },
  {
    label: "Mantle",
    value: "mantle",
    chainId: 5000,
    icon: "/icons/mantle.svg",
    min: 0.001,
    rpcUrls: [
      withAnkr("mantle"),
      "https://rpc.mantle.xyz",
    ],
    testnet: {
      label: "Mantle Testnet",
      value: "mantle-testnet",
      chainId: 5001,
      rpcUrls: [
        withAnkr("mantle_testnet"),
        "https://rpc.testnet.mantle.xyz",
      ],
    },
  },
  {
    label: "Celo",
    value: "celo",
    chainId: 42220,
    icon: "/icons/celo.svg",
    min: 0.001,
    rpcUrls: [
      withAnkr("celo"),
      "https://forno.celo.org",
    ],
    testnet: {
      label: "Alfajores",
      value: "alfajores",
      chainId: 44787,
      rpcUrls: [
        withAnkr("celo_alfajores"),
        "https://alfajores-forno.celo-testnet.org",
      ],
    },
  },
  {
    label: "Gnosis Chain",
    value: "gnosis",
    chainId: 100,
    icon: "/icons/gnosis.svg",
    min: 0.001,
    rpcUrls: [
      withAnkr("xdai"),
      "https://rpc.gnosischain.com",
    ],
    testnet: {
      label: "Chiado",
      value: "chiado",
      chainId: 10200,
      rpcUrls: [
        withAnkr("gnosis_chiado"),
        "https://rpc.chiadochain.net",
      ],
    },
  },
];
