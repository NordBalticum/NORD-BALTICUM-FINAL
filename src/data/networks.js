"use client";

export default [
  {
    label: "Ethereum",
    value: "eth",
    chainId: 1,
    icon: "/icons/eth.svg",
    rpcUrls: [
      "https://cloudflare-eth.com",               // official public
      "https://rpc.ankr.com/eth",                 // fallback public
    ],
    testnet: {
      label: "Sepolia",
      value: "sepolia",
      chainId: 11155111,
      icon: "/icons/eth.svg",
      rpcUrls: [
        "https://rpc.sepolia.org",
        "https://eth-sepolia.public.blastapi.io",
      ],
    },
  },
  {
    label: "Polygon",
    value: "matic",
    chainId: 137,
    icon: "/icons/matic.svg",
    rpcUrls: [
      "https://polygon-rpc.com",
      "https://rpc-mainnet.matic.quiknode.pro",
    ],
    testnet: {
      label: "Mumbai",
      value: "mumbai",
      chainId: 80001,
      icon: "/icons/matic.svg",
      rpcUrls: [
        "https://rpc-mumbai.maticvigil.com",
        "https://matic-testnet-archive-rpc.bwarelabs.com",
      ],
    },
  },
  {
    label: "BNB Chain",
    value: "bnb",
    chainId: 56,
    icon: "/icons/bnb.svg",
    rpcUrls: [
      "https://bsc-dataseed.binance.org",
      "https://bsc-dataseed1.defibit.io",
    ],
    testnet: {
      label: "BNB Testnet",
      value: "tbnb",
      chainId: 97,
      icon: "/icons/bnb.svg",
      rpcUrls: [
        "https://data-seed-prebsc-1-s1.binance.org:8545",
        "https://data-seed-prebsc-2-s1.binance.org:8545",
      ],
    },
  },
  {
    label: "Avalanche",
    value: "avax",
    chainId: 43114,
    icon: "/icons/avax.svg",
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avax.meowrpc.com",
    ],
    testnet: {
      label: "Fuji",
      value: "fuji",
      chainId: 43113,
      icon: "/icons/avax.svg",
      rpcUrls: [
        "https://api.avax-test.network/ext/bc/C/rpc",
        "https://avax-fuji-c-chain.publicnode.com",
      ],
    },
  },
  {
    label: "Optimism",
    value: "optimism",
    chainId: 10,
    icon: "/icons/optimism.svg",
    rpcUrls: [
      "https://mainnet.optimism.io",
      "https://optimism.publicnode.com",
    ],
    testnet: {
      label: "Optimism Goerli",
      value: "optimism-goerli",
      chainId: 420,
      icon: "/icons/optimism.svg",
      rpcUrls: [
        "https://optimism-goerli.publicnode.com",
        "https://goerli.optimism.io",
      ],
    },
  },
  {
    label: "Arbitrum",
    value: "arbitrum",
    chainId: 42161,
    icon: "/icons/arbitrum.svg",
    rpcUrls: [
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum.publicnode.com",
    ],
    testnet: {
      label: "Arbitrum Goerli",
      value: "arbitrum-goerli",
      chainId: 421613,
      icon: "/icons/arbitrum.svg",
      rpcUrls: [
        "https://goerli-rollup.arbitrum.io/rpc",
        "https://arbitrum-goerli.publicnode.com",
      ],
    },
  },
  {
    label: "Base",
    value: "base",
    chainId: 8453,
    icon: "/icons/base.svg",
    rpcUrls: [
      "https://mainnet.base.org",
      "https://base.publicnode.com",
    ],
    testnet: {
      label: "Base Goerli",
      value: "base-goerli",
      chainId: 84531,
      icon: "/icons/base.svg",
      rpcUrls: [
        "https://goerli.base.org",
        "https://base-goerli.publicnode.com",
      ],
    },
  },
  {
    label: "zkSync Era",
    value: "zksync",
    chainId: 324,
    icon: "/icons/zksync.svg",
    rpcUrls: [
      "https://mainnet.era.zksync.io",
      "https://zksync2-mainnet.zksync.dev",
    ],
    testnet: {
      label: "zkSync Testnet",
      value: "zksync-testnet",
      chainId: 280,
      icon: "/icons/zksync.svg",
      rpcUrls: [
        "https://testnet.era.zksync.dev",
        "https://zksync2-testnet.zksync.dev",
      ],
    },
  },
  {
    label: "Linea",
    value: "linea",
    chainId: 59144,
    icon: "/icons/linea.svg",
    rpcUrls: [
      "https://rpc.linea.build",
      "https://linea-mainnet.rpc.thirdweb.com",
    ],
    testnet: {
      label: "Linea Testnet",
      value: "linea-testnet",
      chainId: 59140,
      icon: "/icons/linea.svg",
      rpcUrls: [
        "https://rpc.goerli.linea.build",
        "https://linea-goerli.rpc.thirdweb.com",
      ],
    },
  },
  {
    label: "Scroll",
    value: "scroll",
    chainId: 534352,
    icon: "/icons/scroll.svg",
    rpcUrls: [
      "https://rpc.scroll.io",
      "https://scroll-mainnet.rpc.thirdweb.com",
    ],
    testnet: {
      label: "Scroll Testnet",
      value: "scroll-testnet",
      chainId: 534353,
      icon: "/icons/scroll.svg",
      rpcUrls: [
        "https://scroll-sepolia.public.blastapi.io",
        "https://scroll-testnet.rpc.thirdweb.com",
      ],
    },
  },
  {
    label: "Mantle",
    value: "mantle",
    chainId: 5000,
    icon: "/icons/mantle.svg",
    rpcUrls: [
      "https://rpc.mantle.xyz",
      "https://mantle-mainnet.public.blastapi.io",
    ],
    testnet: {
      label: "Mantle Testnet",
      value: "mantle-testnet",
      chainId: 5001,
      icon: "/icons/mantle.svg",
      rpcUrls: [
        "https://rpc.testnet.mantle.xyz",
        "https://mantle-testnet.public.blastapi.io",
      ],
    },
  },
  {
    label: "Celo",
    value: "celo",
    chainId: 42220,
    icon: "/icons/celo.svg",
    rpcUrls: [
      "https://forno.celo.org",
      "https://rpc.ankr.com/celo",
    ],
    testnet: {
      label: "Alfajores",
      value: "alfajores",
      chainId: 44787,
      icon: "/icons/celo.svg",
      rpcUrls: [
        "https://alfajores-forno.celo-testnet.org",
        "https://alfajores.celo-testnet.org",
      ],
    },
  },
  {
    label: "Gnosis Chain",
    value: "gnosis",
    chainId: 100,
    icon: "/icons/gnosis.svg",
    rpcUrls: [
      "https://rpc.gnosischain.com",
      "https://gnosis.publicnode.com",
    ],
    testnet: {
      label: "Chiado",
      value: "chiado",
      chainId: 10200,
      icon: "/icons/gnosis.svg",
      rpcUrls: [
        "https://rpc.chiadochain.net",
        "https://chiado.publicnode.com",
      ],
    },
  },
];
