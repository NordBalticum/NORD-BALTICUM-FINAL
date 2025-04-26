"use client";

export default [
  {
    label: "Ethereum",
    value: "eth",
    chainId: 1,
    icon: "/icons/eth.svg",
    rpcUrls: [
      "https://cloudflare-eth.com",           // ✅ Cloudflare (be CORS)
      "https://eth.public-rpc.com",            // ✅ Public fallback
    ],
    testnet: {
      label: "Sepolia",
      value: "sepolia",
      chainId: 11155111,
      icon: "/icons/eth.svg",
      rpcUrls: [
        "https://rpc.sepolia.org",             // ✅ Official
        "https://eth-sepolia.public.blastapi.io", // ✅ Blast public
      ],
    },
  },
  {
    label: "Polygon",
    value: "matic",
    chainId: 137,
    icon: "/icons/matic.svg",
    rpcUrls: [
      "https://polygon-rpc.com",               // ✅ Official
      "https://rpc-mainnet.matic.quiknode.pro", // ✅ Quiknode
    ],
    testnet: {
      label: "Mumbai",
      value: "mumbai",
      chainId: 80001,
      icon: "/icons/matic.svg",
      rpcUrls: [
        "https://rpc-mumbai.maticvigil.com",    // ✅ Official
        "https://polygon-mumbai-bor.publicnode.com", // ✅ PublicNode
      ],
    },
  },
  {
    label: "BNB Chain",
    value: "bnb",
    chainId: 56,
    icon: "/icons/bnb.svg",
    rpcUrls: [
      "https://bsc-dataseed.binance.org",       // ✅ Official Binance
      "https://bsc.publicnode.com",             // ✅ PublicNode
    ],
    testnet: {
      label: "BNB Testnet",
      value: "tbnb",
      chainId: 97,
      icon: "/icons/bnb.svg",
      rpcUrls: [
        "https://data-seed-prebsc-1-s1.binance.org:8545", // ✅ Official
        "https://bsc-testnet.publicnode.com",             // ✅ PublicNode
      ],
    },
  },
  {
    label: "Avalanche",
    value: "avax",
    chainId: 43114,
    icon: "/icons/avax.svg",
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",  // ✅ Official
      "https://avalanche.publicnode.com",       // ✅ PublicNode
    ],
    testnet: {
      label: "Fuji",
      value: "fuji",
      chainId: 43113,
      icon: "/icons/avax.svg",
      rpcUrls: [
        "https://api.avax-test.network/ext/bc/C/rpc",     // ✅ Official
        "https://avalanche-fuji-c-chain.publicnode.com",  // ✅ PublicNode
      ],
    },
  },
  {
    label: "Optimism",
    value: "optimism",
    chainId: 10,
    icon: "/icons/optimism.svg",
    rpcUrls: [
      "https://mainnet.optimism.io",             // ✅ Official
      "https://optimism.publicnode.com",         // ✅ PublicNode
    ],
    testnet: {
      label: "Optimism Goerli",
      value: "optimism-goerli",
      chainId: 420,
      icon: "/icons/optimism.svg",
      rpcUrls: [
        "https://optimism-goerli.publicnode.com", // ✅ PublicNode
        "https://goerli.optimism.io",             // ✅ Official
      ],
    },
  },
  {
    label: "Arbitrum",
    value: "arbitrum",
    chainId: 42161,
    icon: "/icons/arbitrum.svg",
    rpcUrls: [
      "https://arb1.arbitrum.io/rpc",             // ✅ Official
      "https://arbitrum.publicnode.com",          // ✅ PublicNode
    ],
    testnet: {
      label: "Arbitrum Goerli",
      value: "arbitrum-goerli",
      chainId: 421613,
      icon: "/icons/arbitrum.svg",
      rpcUrls: [
        "https://goerli-rollup.arbitrum.io/rpc",  // ✅ Official
        "https://arbitrum-goerli.publicnode.com", // ✅ PublicNode
      ],
    },
  },
  {
    label: "Base",
    value: "base",
    chainId: 8453,
    icon: "/icons/base.svg",
    rpcUrls: [
      "https://mainnet.base.org",                 // ✅ Official
      "https://base.publicnode.com",              // ✅ PublicNode
    ],
    testnet: {
      label: "Base Goerli",
      value: "base-goerli",
      chainId: 84531,
      icon: "/icons/base.svg",
      rpcUrls: [
        "https://goerli.base.org",                 // ✅ Official
        "https://base-goerli.publicnode.com",      // ✅ PublicNode
      ],
    },
  },
];
