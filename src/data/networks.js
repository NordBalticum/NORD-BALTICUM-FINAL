// src/data/Networks2.js
import { ethers } from "ethers";

const networks = [
  {
    label: "Ethereum",
    value: "eth",
    chainId: 1,
    icon: "/icons/eth.svg",
    rpcUrls: [
      "https://rpc.ankr.com/eth",
      "https://eth.drpc.org",
      "https://ethereum.publicnode.com"
    ],
    fallbackGas: ethers.parseEther("0.0005"),
    coingeckoId: "ethereum",
    coincapId: "ethereum",
    testnet: {
      label: "Sepolia",
      value: "sepolia",
      chainId: 11155111,
      icon: "/icons/eth.svg",
      rpcUrls: [
        "https://rpc.sepolia.org",
        "https://sepolia.drpc.org",
        "https://ethereum-sepolia.publicnode.com"
      ],
      fallbackGas: ethers.parseEther("0.0005"),
      coingeckoId: "ethereum",
      coincapId: "ethereum"
    }
  },
  {
    label: "Polygon",
    value: "matic",
    chainId: 137,
    icon: "/icons/matic.svg",
    rpcUrls: [
      "https://rpc.ankr.com/polygon",
      "https://polygon-rpc.com",
      "https://polygon-bor.publicnode.com"
    ],
    fallbackGas: ethers.parseUnits("0.3", "ether"),
    coingeckoId: "polygon",
    coincapId: "polygon",
    testnet: {
      label: "Mumbai",
      value: "mumbai",
      chainId: 80001,
      icon: "/icons/matic.svg",
      rpcUrls: [
        "https://rpc.ankr.com/polygon_mumbai",
        "https://rpc-mumbai.maticvigil.com",
        "https://polygon-mumbai-bor.publicnode.com"
      ],
      fallbackGas: ethers.parseUnits("0.3", "ether"),
      coingeckoId: "polygon",
      coincapId: "polygon"
    }
  },
  {
    label: "BNB Chain",
    value: "bnb",
    chainId: 56,
    icon: "/icons/bnb.svg",
    rpcUrls: [
      "https://rpc.ankr.com/bsc",
      "https://bsc-dataseed.bnbchain.org",
      "https://bsc.publicnode.com"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "binancecoin",
    coincapId: "binance-coin",
    testnet: {
      label: "BNB Testnet",
      value: "tbnb",
      chainId: 97,
      icon: "/icons/bnb.svg",
      rpcUrls: [
        "https://bsc-testnet.publicnode.com",
        "https://data-seed-prebsc-1-s1.binance.org:8545",
        "https://rpc.ankr.com/bsc_testnet_chapel"
      ],
      fallbackGas: ethers.parseUnits("0.002", "ether"),
      coingeckoId: "binancecoin",
      coincapId: "binance-coin"
    }
  },
  {
    label: "Avalanche",
    value: "avax",
    chainId: 43114,
    icon: "/icons/avax.svg",
    rpcUrls: [
      "https://rpc.ankr.com/avalanche",
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avax.drpc.org"
    ],
    fallbackGas: ethers.parseUnits("0.01", "ether"),
    coingeckoId: "avalanche-2",
    coincapId: "avalanche",
    testnet: {
      label: "Fuji",
      value: "fuji",
      chainId: 43113,
      icon: "/icons/avax.svg",
      rpcUrls: [
        "https://api.avax-test.network/ext/bc/C/rpc",
        "https://avalanche-fuji-c-chain.publicnode.com",
        "https://avalanche-fuji.drpc.org"
      ],
      fallbackGas: ethers.parseUnits("0.01", "ether"),
      coingeckoId: "avalanche-2",
      coincapId: "avalanche"
    }
  },
  {
    label: "Optimism",
    value: "optimism",
    chainId: 10,
    icon: "/icons/optimism.svg",
    rpcUrls: [
      "https://rpc.ankr.com/optimism",
      "https://optimism.drpc.org",
      "https://optimism.publicnode.com"
    ],
    fallbackGas: ethers.parseEther("0.0005"),
    coingeckoId: "optimism",
    coincapId: "optimism",
    testnet: {
      label: "Optimism Goerli",
      value: "optimism-goerli",
      chainId: 420,
      icon: "/icons/optimism.svg",
      rpcUrls: [
        "https://optimism-goerli.publicnode.com",
        "https://goerli.optimism.io",
        "https://optimism-goerli.drpc.org"
      ],
      fallbackGas: ethers.parseEther("0.0005"),
      coingeckoId: "optimism",
      coincapId: "optimism"
    }
  },
  {
    label: "Arbitrum",
    value: "arbitrum",
    chainId: 42161,
    icon: "/icons/arbitrum.svg",
    rpcUrls: [
      "https://rpc.ankr.com/arbitrum",
      "https://arbitrum.drpc.org",
      "https://arbitrum-one.publicnode.com"
    ],
    fallbackGas: ethers.parseEther("0.0005"),
    coingeckoId: "arbitrum",
    coincapId: "arbitrum",
    testnet: {
      label: "Arbitrum Goerli",
      value: "arbitrum-goerli",
      chainId: 421613,
      icon: "/icons/arbitrum.svg",
      rpcUrls: [
        "https://arbitrum-goerli.publicnode.com",
        "https://goerli-rollup.arbitrum.io/rpc",
        "https://arbitrum-goerli.drpc.org"
      ],
      fallbackGas: ethers.parseEther("0.0005"),
      coingeckoId: "arbitrum",
      coincapId: "arbitrum"
    }
  },
  {
    label: "Base",
    value: "base",
    chainId: 8453,
    icon: "/icons/base.svg",
    rpcUrls: [
      "https://mainnet.base.org",
      "https://developer-access-mainnet.base.org",
      "https://base.drpc.org"
    ],
    fallbackGas: ethers.parseEther("0.0005"),
    coingeckoId: "base",
    coincapId: "base",
    testnet: {
      label: "Base Goerli",
      value: "base-goerli",
      chainId: 84531,
      icon: "/icons/base.svg",
      rpcUrls: [
        "https://goerli.base.org",
        "https://base-goerli.publicnode.com",
        "https://base-goerli.drpc.org"
      ],
      fallbackGas: ethers.parseEther("0.0005"),
      coingeckoId: "base",
      coincapId: "base"
    }
  },
  {
    label: "zkSync Era",
    value: "zksync",
    chainId: 324,
    icon: "/icons/zksync.svg",
    rpcUrls: [
      "https://mainnet.era.zksync.io",
      "https://zksync2-mainnet.zksync.io"
    ],
    fallbackGas: ethers.parseUnits("0.0005", "ether"),
    coingeckoId: "zksync",
    coincapId: "zksync"
  },
  {
    label: "Linea",
    value: "linea",
    chainId: 59144,
    icon: "/icons/linea.svg",
    rpcUrls: [
      "https://rpc.linea.build",
      "https://linea-mainnet.infura.io/v3"
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
    coingeckoId: "linea",
    coincapId: "linea"
  },
  {
    label: "Mantle",
    value: "mantle",
    chainId: 5000,
    icon: "/icons/mantle.svg",
    rpcUrls: [
      "https://rpc.mantle.xyz",
      "https://mantle.drpc.org"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "mantle",
    coincapId: "mantle",
    testnet: {
      label: "Mantle Testnet",
      value: "mantle-testnet",
      chainId: 5001,
      icon: "/icons/mantle.svg",
      rpcUrls: [
        "https://rpc.testnet.mantle.xyz"
      ],
      fallbackGas: ethers.parseUnits("0.002", "ether"),
      coingeckoId: "mantle",
      coincapId: "mantle"
    }
  },
  {
    label: "Scroll",
    value: "scroll",
    chainId: 534352,
    icon: "/icons/scroll.svg",
    rpcUrls: [
      "https://rpc.scroll.io",
      "https://scroll.drpc.org"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "scroll",
    coincapId: "scroll"
  },
  {
    label: "Celo",
    value: "celo",
    chainId: 42220,
    icon: "/icons/celo.svg",
    rpcUrls: [
      "https://forno.celo.org",
      "https://rpc.ankr.com/celo"
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
    coingeckoId: "celo",
    coincapId: "celo"
  },
  {
    label: "Moonbeam",
    value: "moonbeam",
    chainId: 1284,
    icon: "/icons/moonbeam.svg",
    rpcUrls: [
      "https://rpc.api.moonbeam.network",
      "https://moonbeam.public.blastapi.io"
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
    coingeckoId: "moonbeam",
    coincapId: "moonbeam"
  },
  {
    label: "Aurora",
    value: "aurora",
    chainId: 1313161554,
    icon: "/icons/aurora.svg",
    rpcUrls: [
      "https://mainnet.aurora.dev",
      "https://aurora-mainnet.drpc.org"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "aurora",
    coincapId: "aurora"
  },
  {
    label: "Gnosis",
    value: "gnosis",
    chainId: 100,
    icon: "/icons/gnosis.svg",
    rpcUrls: [
      "https://rpc.gnosischain.com",
      "https://gnosis.drpc.org"
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
    coingeckoId: "xdai",
    coincapId: "xdai"
  },
  {
    label: "Fuse",
    value: "fuse",
    chainId: 122,
    icon: "/icons/fuse.svg",
    rpcUrls: [
      "https://rpc.fuse.io",
      "https://fuse-rpc.gateway.pokt.network"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "fuse-network-token",
    coincapId: "fuse"
  }
  {
    label: "Fantom",
    value: "fantom",
    chainId: 250,
    icon: "/icons/fantom.svg",
    rpcUrls: [
      "https://rpc.ankr.com/fantom",
      "https://rpcapi.fantom.network",
      "https://fantom.publicnode.com"
    ],
    fallbackGas: ethers.parseUnits("0.01", "ether"),
    coingeckoId: "fantom",
    coincapId: "fantom",
    testnet: {
      label: "Fantom Testnet",
      value: "fantom-testnet",
      chainId: 4002,
      icon: "/icons/fantom.svg",
      rpcUrls: [
        "https://rpc.testnet.fantom.network"
      ],
      fallbackGas: ethers.parseUnits("0.01", "ether"),
      coingeckoId: "fantom",
      coincapId: "fantom"
    }
  },
  {
    label: "Evmos",
    value: "evmos",
    chainId: 9001,
    icon: "/icons/evmos.svg",
    rpcUrls: [
      "https://eth.bd.evmos.org:8545",
      "https://evmos-evm.publicnode.com"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "evmos",
    coincapId: "evmos"
  },
  {
    label: "Kava",
    value: "kava",
    chainId: 2222,
    icon: "/icons/kava.svg",
    rpcUrls: [
      "https://evm.kava.io",
      "https://kava-rpc.gateway.pokt.network"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "kava",
    coincapId: "kava"
  },
  {
    label: "OKX",
    value: "okx",
    chainId: 66,
    icon: "/icons/okx.svg",
    rpcUrls: [
      "https://exchainrpc.okex.org"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "okex-chain",
    coincapId: "okex-chain"
  },
  {
    label: "Bitgert",
    value: "bitgert",
    chainId: 32520,
    icon: "/icons/bitgert.svg",
    rpcUrls: [
      "https://mainnet-rpc.brisescan.com"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "bitgert",
    coincapId: "bitgert"
  },
  {
    label: "CoreDAO",
    value: "coredao",
    chainId: 1116,
    icon: "/icons/coredao.svg",
    rpcUrls: [
      "https://rpc.coredao.org"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "coredao",
    coincapId: "coredao"
  },
  {
    label: "Dogechain",
    value: "dogechain",
    chainId: 2000,
    icon: "/icons/dogechain.svg",
    rpcUrls: [
      "https://rpc.dogechain.dog"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "dogechain",
    coincapId: "dogechain"
  },
  {
    label: "Telos",
    value: "telos",
    chainId: 40,
    icon: "/icons/telos.svg",
    rpcUrls: [
      "https://mainnet.telos.net/evm"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "telos",
    coincapId: "telos"
  },
  {
    label: "Theta Testnet",
    value: "theta-testnet",
    chainId: 365,
    icon: "/icons/theta.svg",
    rpcUrls: [
      "https://eth-rpc-api-testnet.thetatoken.org/rpc"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "theta-token",
    coincapId: "theta"
  },
  {
    label: "KardiaChain",
    value: "kardia",
    chainId: 24,
    icon: "/icons/kardia.svg",
    rpcUrls: [
      "https://rpc.kardiachain.io"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "kardiachain",
    coincapId: "kardiachain"
  },
  {
    label: "Oasis Emerald",
    value: "oasis",
    chainId: 42262,
    icon: "/icons/oasis.svg",
    rpcUrls: [
      "https://emerald.oasis.dev"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "oasis-network",
    coincapId: "oasis"
  },
  {
    label: "Rootstock",
    value: "rsk",
    chainId: 30,
    icon: "/icons/rsk.svg",
    rpcUrls: [
      "https://public-node.rsk.co"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "rsksmart",
    coincapId: "rsksmart"
  },
  {
    label: "Exosama",
    value: "exosama",
    chainId: 2109,
    icon: "/icons/exosama.svg",
    rpcUrls: [
      "https://rpc.exosama.com"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "exosama",
    coincapId: "exosama"
  },
  {
    label: "Luxy",
    value: "luxy",
    chainId: 88002,
    icon: "/icons/luxy.svg",
    rpcUrls: [
      "https://rpc.luxy.io"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "luxy",
    coincapId: "luxy"
  },
  {
    label: "TomoChain",
    value: "tomo",
    chainId: 88,
    icon: "/icons/tomo.svg",
    rpcUrls: [
      "https://rpc.tomochain.com"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "tomochain",
    coincapId: "tomochain"
  },
  {
    label: "Callisto",
    value: "callisto",
    chainId: 820,
    icon: "/icons/callisto.svg",
    rpcUrls: [
      "https://rpc.callisto.network"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "callisto",
    coincapId: "callisto"
  },
  {
    label: "Energi",
    value: "energi",
    chainId: 39797,
    icon: "/icons/energi.svg",
    rpcUrls: [
      "https://nodeapi.energi.network"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "energi",
    coincapId: "energi"
  },
  {
    label: "Canto",
    value: "canto",
    chainId: 7700,
    icon: "/icons/canto.svg",
    rpcUrls: [
      "https://canto.slingshot.finance"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "canto",
    coincapId: "canto"
  },
  {
    label: "Tally",
    value: "tally",
    chainId: 1337,
    icon: "/icons/tally.svg",
    rpcUrls: [
      "https://rpc.tally.cash"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "tally",
    coincapId: "tally"
  },
  {
    label: "Velas",
    value: "velas",
    chainId: 106,
    icon: "/icons/velas.svg",
    rpcUrls: [
      "https://evmexplorer.velas.com/rpc"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "velas",
    coincapId: "velas"
  },
  {
    label: "Godwoken",
    value: "godwoken",
    chainId: 71402,
    icon: "/icons/godwoken.svg",
    rpcUrls: [
      "https://mainnet.godwoken.io/rpc"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "godwoken",
    coincapId: "godwoken"
  },
  {
    label: "Metis",
    value: "metis",
    chainId: 1088,
    icon: "/icons/metis.svg",
    rpcUrls: [
      "https://andromeda.metis.io/?owner=1088"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "metis-token",
    coincapId: "metis"
  },
  {
    label: "Cronos",
    value: "cronos",
    chainId: 25,
    icon: "/icons/cronos.svg",
    rpcUrls: [
      "https://evm.cronos.org"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "cronos",
    coincapId: "cronos"
  },
  {
    label: "Rei Network",
    value: "rei",
    chainId: 47805,
    icon: "/icons/rei.svg",
    rpcUrls: [
      "https://rpc.rei.network"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "rei-network",
    coincapId: "rei"
  },
  {
    label: "Zora",
    value: "zora",
    chainId: 7777777,
    icon: "/icons/zora.svg",
    rpcUrls: [
      "https://rpc.zora.energy"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "zora",
    coincapId: "zora"
  },
  {
    label: "ZetaChain",
    value: "zeta",
    chainId: 7000,
    icon: "/icons/zeta.svg",
    rpcUrls: [
      "https://zetachain-evm.blockpi.network/v1/rpc/public"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "zetachain",
    coincapId: "zetachain"
  },
  {
    label: "zkFair",
    value: "zkfair",
    chainId: 42766,
    icon: "/icons/zkfair.svg",
    rpcUrls: [
      "https://rpc.zkfair.io"
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    coingeckoId: "zkfair",
    coincapId: "zkfair"
  }
];

export default networks;

// ==============================
// ✅ Utility eksportai
// ==============================

/**
 * Gauti visą network objektą pagal chainId
 */
export const getNetworkByChainId = (chainId) => {
  return networks.find((n) => n.chainId === chainId) ||
    networks.find((n) => n.testnet?.chainId === chainId) ||
    null;
};

/**
 * Gauti RPC URL'ų sąrašą pagal chainId
 */
export const getRPCUrls = (chainId) => {
  const net = getNetworkByChainId(chainId);
  return net?.rpcUrls || net?.testnet?.rpcUrls || [];
};

/**
 * Gauti fallback gas rezervą pagal chainId
 */
export const getFallbackGasByChainId = (chainId) => {
  const net = getNetworkByChainId(chainId);
  return net?.fallbackGas || net?.testnet?.fallbackGas || ethers.parseUnits("0.002", "ether");
};

/**
 * Gauti CoinGecko ID pagal chainId
 */
export const getCoinGeckoId = (chainId) => {
  const net = getNetworkByChainId(chainId);
  return net?.coingeckoId || net?.testnet?.coingeckoId || null;
};

/**
 * Gauti CoinCap ID pagal chainId
 */
export const getCoinCapId = (chainId) => {
  const net = getNetworkByChainId(chainId);
  return net?.coincapId || net?.testnet?.coincapId || null;
};

/**
 * Gauti visų palaikomų chainId sąrašą
 */
export const getAllChainIds = () => {
  const main = networks.map((n) => n.chainId);
  const test = networks
    .map((n) => n.testnet?.chainId)
    .filter((id) => typeof id === "number");
  return [...main, ...test];
};

/**
 * Gauti network objektą pagal value (pvz. "matic", "eth", "bnb")
 */
export const getNetworkByValue = (value) => {
  return networks.find((n) => n.value === value) ||
    networks.find((n) => n.testnet?.value === value) ||
    null;
};

/**
 * Gauti visus mainnet sąrašus (be testnet)
 */
export const getMainnetList = () => {
  return networks;
};

/**
 * Gauti visus testnet sąrašus
 */
export const getTestnetList = () => {
  return networks
    .filter((n) => n.testnet)
    .map((n) => n.testnet);
};

/**
 * Patikrinti ar chainId yra palaikomas
 */
export const isSupportedChain = (chainId) => {
  return getAllChainIds().includes(chainId);
};
