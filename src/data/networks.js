// src/data/networks.js
"use client";

// Your Ankr API key (must be set in .env.local as NEXT_PUBLIC_ANKR_KEY)
const ANKR_KEY = process.env.NEXT_PUBLIC_ANKR_KEY;
if (!ANKR_KEY) {
  console.warn("⚠️ NEXT_PUBLIC_ANKR_KEY not set! You may hit rate limits or 403s.");
}

export default [
  // ────────── Ethereum ──────────
  {
    label: "Ethereum",
    value: "eth",
    chainId: 1,
    icon: "/icons/eth.svg",
    color: "color-eth",
    rpcUrls: [
      `https://rpc.ankr.com/eth/${ANKR_KEY}`,  // your Ankr key
      "https://cloudflare-eth.com"
    ],
    testnet: {
      label: "Sepolia",
      value: "sepolia",
      chainId: 11155111,
      icon: "/icons/eth.svg",
      color: "color-eth",
      rpcUrls: [
        `https://rpc.ankr.com/eth_sepolia/${ANKR_KEY}`,
        "https://sepolia.publicnode.com"
      ]
    }
  },

  // ────────── Polygon ──────────
  {
    label: "Polygon",
    value: "matic",
    chainId: 137,
    icon: "/icons/matic.svg",
    color: "color-polygon",
    rpcUrls: [
      `https://rpc.ankr.com/polygon/${ANKR_KEY}`,
      "https://polygon-rpc.com"
    ],
    testnet: {
      label: "Mumbai",
      value: "mumbai",
      chainId: 80001,
      icon: "/icons/matic.svg",
      color: "color-polygon",
      rpcUrls: [
        `https://rpc.ankr.com/polygon_mumbai/${ANKR_KEY}`,
        "https://rpc-mumbai.maticvigil.com"
      ]
    }
  },

  // ────────── BNB Chain ──────────
  {
    label: "BNB Smart Chain",
    value: "bnb",
    chainId: 56,
    icon: "/icons/bnb.svg",
    color: "color-bnb",
    rpcUrls: [
      `https://rpc.ankr.com/bsc/${ANKR_KEY}`,
      "https://bsc-dataseed.binance.org"
    ],
    testnet: {
      label: "BNB Testnet",
      value: "tbnb",
      chainId: 97,
      icon: "/icons/bnb.svg",
      color: "color-bnb",
      rpcUrls: [
        `https://rpc.ankr.com/bsc_testnet/${ANKR_KEY}`,
        "https://bsc-testnet.publicnode.com"
      ]
    }
  },

  // ────────── Avalanche ──────────
  {
    label: "Avalanche",
    value: "avax",
    chainId: 43114,
    icon: "/icons/avax.svg",
    color: "color-avax",
    rpcUrls: [
      `https://rpc.ankr.com/avalanche/${ANKR_KEY}`,
      "https://api.avax.network/ext/bc/C/rpc"
    ],
    testnet: {
      label: "Fuji",
      value: "fuji",
      chainId: 43113,
      icon: "/icons/avax.svg",
      color: "color-avax",
      rpcUrls: [
        `https://rpc.ankr.com/avalanche_fuji/${ANKR_KEY}`,
        "https://avalanche-fuji.publicnode.com"
      ]
    }
  },

  // ────────── Optimism ──────────
  {
    label: "Optimism",
    value: "optimism",
    chainId: 10,
    icon: "/icons/optimism.svg",
    color: "color-optimism",
    rpcUrls: [
      `https://rpc.ankr.com/optimism/${ANKR_KEY}`,
      "https://mainnet.optimism.io"
    ],
    testnet: {
      label: "Optimism Goerli",
      value: "optimismgoerli",
      chainId: 420,
      icon: "/icons/optimism.svg",
      color: "color-optimism",
      rpcUrls: [
        `https://rpc.ankr.com/optimism_goerli/${ANKR_KEY}`,
        "https://optimism-goerli.publicnode.com"
      ]
    }
  },

  // ────────── Arbitrum One ──────────
  {
    label: "Arbitrum One",
    value: "arbitrum",
    chainId: 42161,
    icon: "/icons/arbitrum.svg",
    color: "color-arbitrum",
    rpcUrls: [
      `https://rpc.ankr.com/arbitrum/${ANKR_KEY}`,
      "https://arb1.arbitrum.io/rpc"
    ],
    testnet: {
      label: "Arbitrum Goerli",
      value: "arbitrumgoerli",
      chainId: 421613,
      icon: "/icons/arbitrum.svg",
      color: "color-arbitrum",
      rpcUrls: [
        `https://rpc.ankr.com/arbitrum_goerli/${ANKR_KEY}`,
        "https://goerli-rollup.arbitrum.io/rpc"
      ]
    }
  },

  // ────────── Base ──────────
  {
    label: "Base",
    value: "base",
    chainId: 8453,
    icon: "/icons/base.svg",
    color: "color-base",
    rpcUrls: [
      `https://rpc.ankr.com/base/${ANKR_KEY}`,
      "https://base-mainnet.public.blastapi.io"
    ],
    testnet: {
      label: "Base Goerli",
      value: "basegoerli",
      chainId: 84531,
      icon: "/icons/base.svg",
      color: "color-base",
      rpcUrls: [
        `https://rpc.ankr.com/base_goerli/${ANKR_KEY}`,
        "https://goerli.base.org"
      ]
    }
  },

  // ────────── zkSync Era ──────────
  {
    label: "zkSync Era",
    value: "zksync",
    chainId: 324,
    icon: "/icons/zksync.svg",
    color: "color-zksync",
    rpcUrls: [
      `https://rpc.ankr.com/zksync/${ANKR_KEY}`,
      "https://mainnet.era.zksync.io"
    ],
    testnet: {
      label: "zkSync Testnet",
      value: "zksynctest",
      chainId: 280,
      icon: "/icons/zksync.svg",
      color: "color-zksync",
      rpcUrls: [
        `https://rpc.ankr.com/zksync_testnet/${ANKR_KEY}`,
        "https://testnet.era.zksync.dev"
      ]
    }
  },

  // ────────── Linea ──────────
  {
    label: "Linea",
    value: "linea",
    chainId: 59144,
    icon: "/icons/linea.svg",
    color: "color-linea",
    rpcUrls: [
      `https://rpc.ankr.com/linea/${ANKR_KEY}`,
      "https://rpc.linea.build"
    ],
    testnet: {
      label: "Linea Testnet",
      value: "lineatest",
      chainId: 59140,
      icon: "/icons/linea.svg",
      color: "color-linea",
      rpcUrls: [
        `https://rpc.ankr.com/linea_goerli/${ANKR_KEY}`,
        "https://rpc.goerli.linea.build"
      ]
    }
  },

  // ────────── Scroll ──────────
  {
    label: "Scroll",
    value: "scroll",
    chainId: 534352,
    icon: "/icons/scroll.svg",
    color: "color-scroll",
    rpcUrls: [
      `https://rpc.ankr.com/scroll/${ANKR_KEY}`,
      "https://scroll.io/l2"
    ],
    testnet: {
      label: "Scroll Testnet",
      value: "scrolltest",
      chainId: 534353,
      icon: "/icons/scroll.svg",
      color: "color-scroll",
      rpcUrls: [
        `https://rpc.ankr.com/scroll_testnet/${ANKR_KEY}`,
        "https://scroll-testnet.public.blastapi.io"
      ]
    }
  },

  // ────────── Mantle ──────────
  {
    label: "Mantle",
    value: "mantle",
    chainId: 5000,
    icon: "/icons/mantle.svg",
    color: "color-mantle",
    rpcUrls: [
      `https://rpc.ankr.com/mantle/${ANKR_KEY}`,
      "https://rpc.mantle.xyz"
    ],
    testnet: {
      label: "Mantle Testnet",
      value: "mantletest",
      chainId: 5001,
      icon: "/icons/mantle.svg",
      color: "color-mantle",
      rpcUrls: [
        `https://rpc.ankr.com/mantle_testnet/${ANKR_KEY}`,
        "https://rpc.testnet.mantle.xyz"
      ]
    }
  },

  // ────────── Celo ──────────
  {
    label: "Celo",
    value: "celo",
    chainId: 42220,
    icon: "/icons/celo.svg",
    color: "color-celo",
    rpcUrls: [
      `https://rpc.ankr.com/celo/${ANKR_KEY}`,
      "https://forno.celo.org"
    ],
    testnet: {
      label: "Alfajores",
      value: "alfajores",
      chainId: 44787,
      icon: "/icons/celo.svg",
      color: "color-celo",
      rpcUrls: [
        `https://rpc.ankr.com/celo_alfajores/${ANKR_KEY}`,
        "https://alfajores-forno.celo-testnet.org"
      ]
    }
  },

  // ────────── Gnosis Chain ──────────
  {
    label: "Gnosis Chain",
    value: "gnosis",
    chainId: 100,
    icon: "/icons/xdai.svg",
    color: "color-gnosis",
    rpcUrls: [
      `https://rpc.ankr.com/xdai/${ANKR_KEY}`,
      "https://rpc.gnosischain.com"
    ],
    testnet: {
      label: "Chiado",
      value: "chiado",
      chainId: 10200,
      icon: "/icons/xdai.svg",
      color: "color-gnosis",
      rpcUrls: [
        `https://rpc.ankr.com/gnosis_chiado/${ANKR_KEY}`,
        "https://rpc.chiadochain.net"
      ]
    }
  }
];
