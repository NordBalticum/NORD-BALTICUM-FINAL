// src/data/networks.js
import { JsonRpcProvider, FallbackProvider, ethers } from "ethers";

const networks = [
  {
    label: "Ethereum",
    value: "eth",
    chainId: 1,
    icon: "/icons/eth.svg",
    rpcUrls: [
      "https://rpc.ankr.com/eth",
      "https://eth.drpc.org",
      "https://ethereum.publicnode.com",
    ],
    fallbackGas: ethers.parseEther("0.0005"),
    testnet: {
      label: "Sepolia",
      value: "sepolia",
      chainId: 11155111,
      icon: "/icons/eth.svg",
      rpcUrls: [
        "https://rpc.sepolia.org",
        "https://sepolia.drpc.org",
        "https://ethereum-sepolia.publicnode.com",
      ],
      fallbackGas: ethers.parseEther("0.0005"),
    },
  },
  {
    label: "Polygon",
    value: "matic",
    chainId: 137,
    icon: "/icons/matic.svg",
    rpcUrls: [
      "https://rpc.ankr.com/polygon",
      "https://polygon-rpc.com",
      "https://polygon-bor.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.3", "ether"),
    testnet: {
      label: "Mumbai",
      value: "mumbai",
      chainId: 80001,
      icon: "/icons/matic.svg",
      rpcUrls: [
        "https://rpc.ankr.com/polygon_mumbai",
        "https://rpc-mumbai.maticvigil.com",
        "https://polygon-mumbai-bor.publicnode.com",
      ],
      fallbackGas: ethers.parseUnits("0.3", "ether"),
    },
  },
  {
    label: "BNB Chain",
    value: "bnb",
    chainId: 56,
    icon: "/icons/bnb.svg",
    rpcUrls: [
      "https://rpc.ankr.com/bsc",
      "https://bsc-dataseed.bnbchain.org",
      "https://bsc.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    testnet: {
      label: "BNB Testnet",
      value: "tbnb",
      chainId: 97,
      icon: "/icons/bnb.svg",
      rpcUrls: [
        "https://bsc-testnet.publicnode.com",
        "https://data-seed-prebsc-1-s1.binance.org:8545",
        "https://rpc.ankr.com/bsc_testnet_chapel",
      ],
      fallbackGas: ethers.parseUnits("0.002", "ether"),
    },
  },
];

{
    label: "Avalanche",
    value: "avax",
    chainId: 43114,
    icon: "/icons/avax.svg",
    rpcUrls: [
      "https://rpc.ankr.com/avalanche",
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avax.drpc.org",
    ],
    fallbackGas: ethers.parseUnits("0.01", "ether"),
    testnet: {
      label: "Fuji",
      value: "fuji",
      chainId: 43113,
      icon: "/icons/avax.svg",
      rpcUrls: [
        "https://api.avax-test.network/ext/bc/C/rpc",
        "https://avalanche-fuji-c-chain.publicnode.com",
        "https://avalanche-fuji.drpc.org",
      ],
      fallbackGas: ethers.parseUnits("0.01", "ether"),
    },
  },
  {
    label: "Optimism",
    value: "optimism",
    chainId: 10,
    icon: "/icons/optimism.svg",
    rpcUrls: [
      "https://rpc.ankr.com/optimism",
      "https://mainnet.optimism.io",
      "https://optimism.publicnode.com",
    ],
    fallbackGas: ethers.parseEther("0.0005"),
    testnet: {
      label: "Optimism Goerli",
      value: "optimism-goerli",
      chainId: 420,
      icon: "/icons/optimism.svg",
      rpcUrls: [
        "https://optimism-goerli.publicnode.com",
        "https://goerli.optimism.io",
        "https://optimism-goerli.drpc.org",
      ],
      fallbackGas: ethers.parseEther("0.0005"),
    },
  },
  {
    label: "Arbitrum",
    value: "arbitrum",
    chainId: 42161,
    icon: "/icons/arbitrum.svg",
    rpcUrls: [
      "https://rpc.ankr.com/arbitrum",
      "https://arb1.arbitrum.io/rpc",
      "https://arbitrum.publicnode.com",
    ],
    fallbackGas: ethers.parseEther("0.0005"),
    testnet: {
      label: "Arbitrum Goerli",
      value: "arbitrum-goerli",
      chainId: 421613,
      icon: "/icons/arbitrum.svg",
      rpcUrls: [
        "https://arbitrum-goerli.publicnode.com",
        "https://goerli-rollup.arbitrum.io/rpc",
        "https://arbitrum-goerli.drpc.org",
      ],
      fallbackGas: ethers.parseEther("0.0005"),
    },
  },

        {
    label: "Base",
    value: "base",
    chainId: 8453,
    icon: "/icons/base.svg",
    rpcUrls: [
      "https://mainnet.base.org",
      "https://developer-access-mainnet.base.org",
      "https://base.publicnode.com",
    ],
    fallbackGas: ethers.parseEther("0.0005"),
    testnet: {
      label: "Base Goerli",
      value: "base-goerli",
      chainId: 84531,
      icon: "/icons/base.svg",
      rpcUrls: [
        "https://goerli.base.org",
        "https://base-goerli.publicnode.com",
        "https://base-goerli.drpc.org",
      ],
      fallbackGas: ethers.parseEther("0.0005"),
    },
  },
  {
    label: "Scroll",
    value: "scroll",
    chainId: 534352,
    icon: "/icons/scroll.svg",
    rpcUrls: [
      "https://rpc.scroll.io",
      "https://scroll.drpc.org",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Linea",
    value: "linea",
    chainId: 59144,
    icon: "/icons/linea.svg",
    rpcUrls: [
      "https://rpc.linea.build",
      "https://linea-mainnet.infura.io/v3",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "zkSync Era",
    value: "zksync",
    chainId: 324,
    icon: "/icons/zksync.svg",
    rpcUrls: [
      "https://mainnet.era.zksync.io",
      "https://zksync2-mainnet.zksync.io",
    ],
    fallbackGas: ethers.parseUnits("0.0005", "ether"),
  },
  {
    label: "Mantle",
    value: "mantle",
    chainId: 5000,
    icon: "/icons/mantle.svg",
    rpcUrls: [
      "https://rpc.mantle.xyz",
      "https://mantle.drpc.org",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
    testnet: {
      label: "Mantle Testnet",
      value: "mantle-testnet",
      chainId: 5001,
      icon: "/icons/mantle.svg",
      rpcUrls: [
        "https://rpc.testnet.mantle.xyz",
      ],
      fallbackGas: ethers.parseUnits("0.002", "ether"),
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
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Moonbeam",
    value: "moonbeam",
    chainId: 1284,
    icon: "/icons/moonbeam.svg",
    rpcUrls: [
      "https://rpc.api.moonbeam.network",
      "https://moonbeam.public.blastapi.io",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Aurora",
    value: "aurora",
    chainId: 1313161554,
    icon: "/icons/aurora.svg",
    rpcUrls: [
      "https://mainnet.aurora.dev",
      "https://aurora-mainnet.drpc.org",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Fantom",
    value: "fantom",
    chainId: 250,
    icon: "/icons/fantom.svg",
    rpcUrls: [
      "https://rpc.ankr.com/fantom",
      "https://fantom.publicnode.com",
      "https://rpcapi.fantom.network",
    ],
    fallbackGas: ethers.parseUnits("0.01", "ether"),
    testnet: {
      label: "Fantom Testnet",
      value: "fantom-testnet",
      chainId: 4002,
      icon: "/icons/fantom.svg",
      rpcUrls: [
        "https://rpc.testnet.fantom.network",
      ],
      fallbackGas: ethers.parseUnits("0.01", "ether"),
    },
  },
  {
    label: "Gnosis",
    value: "gnosis",
    chainId: 100,
    icon: "/icons/gnosis.svg",
    rpcUrls: [
      "https://rpc.gnosischain.com",
      "https://gnosis.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "CoreDAO",
    value: "core",
    chainId: 1116,
    icon: "/icons/core.svg",
    rpcUrls: [
      "https://rpc.coredao.org",
      "https://core.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Dogechain",
    value: "dogechain",
    chainId: 2000,
    icon: "/icons/dogechain.svg",
    rpcUrls: [
      "https://rpc.dogechain.dog",
      "https://rpc01-sg.dogechain.dog",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "zkFair",
    value: "zkfair",
    chainId: 42766,
    icon: "/icons/zkfair.svg",
    rpcUrls: [
      "https://rpc.zkfair.io",
      "https://mainnet.rpc.zkfair.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },

        {
    label: "Flare",
    value: "flare",
    chainId: 14,
    icon: "/icons/flare.svg",
    rpcUrls: [
      "https://flare-api.flare.network/ext/C/rpc",
      "https://rpc.flare.network",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Kava",
    value: "kava",
    chainId: 2222,
    icon: "/icons/kava.svg",
    rpcUrls: [
      "https://evm.kava.io",
      "https://kava.rpc.thirdweb.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Metis",
    value: "metis",
    chainId: 1088,
    icon: "/icons/metis.svg",
    rpcUrls: [
      "https://andromeda.metis.io/?owner=1088",
      "https://metis-mainnet.public.blastapi.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "OKX",
    value: "okx",
    chainId: 66,
    icon: "/icons/okx.svg",
    rpcUrls: [
      "https://exchainrpc.okex.org",
      "https://okc-mainnet.public.blastapi.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Cronos",
    value: "cronos",
    chainId: 25,
    icon: "/icons/cronos.svg",
    rpcUrls: [
      "https://evm.cronos.org",
      "https://cronos.blockpi.network/v1/rpc/public",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Bitgert",
    value: "brise",
    chainId: 32520,
    icon: "/icons/brise.svg",
    rpcUrls: [
      "https://rpc.icecreamswap.com",
      "https://mainnet-rpc.brisescan.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Boba",
    value: "boba",
    chainId: 288,
    icon: "/icons/boba.svg",
    rpcUrls: [
      "https://mainnet.boba.network",
      "https://boba-mainnet.public.blastapi.io",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Astar",
    value: "astar",
    chainId: 592,
    icon: "/icons/astar.svg",
    rpcUrls: [
      "https://rpc.astar.network:8545",
      "https://astar-mainnet.public.blastapi.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Velas",
    value: "velas",
    chainId: 106,
    icon: "/icons/velas.svg",
    rpcUrls: [
      "https://evmexplorer.velas.com/rpc",
      "https://velas-mainnet.public.blastapi.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },

        {
    label: "Fuse",
    value: "fuse",
    chainId: 122,
    icon: "/icons/fuse.svg",
    rpcUrls: [
      "https://rpc.fuse.io",
      "https://fuse-mainnet.chainstacklabs.com",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Canto",
    value: "canto",
    chainId: 7700,
    icon: "/icons/canto.svg",
    rpcUrls: [
      "https://canto.slingshot.finance",
      "https://canto.gravitychain.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Evmos",
    value: "evmos",
    chainId: 9001,
    icon: "/icons/evmos.svg",
    rpcUrls: [
      "https://eth.bd.evmos.org:8545",
      "https://evmos-json-rpc.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Rootstock",
    value: "rsk",
    chainId: 30,
    icon: "/icons/rsk.svg",
    rpcUrls: [
      "https://public-node.rsk.co",
      "https://mainnet-rpc.rsk.co",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Telos",
    value: "telos",
    chainId: 40,
    icon: "/icons/telos.svg",
    rpcUrls: [
      "https://mainnet.telos.net/evm",
      "https://rpc1.us.telos.net/evm",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Rei Network",
    value: "rei",
    chainId: 47805,
    icon: "/icons/rei.svg",
    rpcUrls: [
      "https://rpc.rei.network",
      "https://rei-rpc.din.dev",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Shardeum",
    value: "shardeum",
    chainId: 8080,
    icon: "/icons/shardeum.svg",
    rpcUrls: [
      "https://sphinx.shardeum.org",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Tenet",
    value: "tenet",
    chainId: 1559,
    icon: "/icons/tenet.svg",
    rpcUrls: [
      "https://rpc.tenet.org",
      "https://tenet-rpc.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Klaytn",
    value: "klaytn",
    chainId: 8217,
    icon: "/icons/klaytn.svg",
    rpcUrls: [
      "https://public-en-cypress.klaytn.net",
      "https://klaytn.blockpi.network/v1/rpc/public",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "BitTorrent Chain",
    value: "btt",
    chainId: 199,
    icon: "/icons/btt.svg",
    rpcUrls: [
      "https://rpc.bittorrentchain.io",
      "https://bttc.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },

        {
    label: "Palm",
    value: "palm",
    chainId: 11297108109,
    icon: "/icons/palm.svg",
    rpcUrls: [
      "https://palm-mainnet.infura.io/v3",
      "https://palm-mainnet.public.blastapi.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Metachain",
    value: "metachain",
    chainId: 2100,
    icon: "/icons/metachain.svg",
    rpcUrls: [
      "https://rpc.metachain.network",
      "https://metachain-rpc.din.dev",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Energy Web",
    value: "energyweb",
    chainId: 246,
    icon: "/icons/energyweb.svg",
    rpcUrls: [
      "https://rpc.energyweb.org",
      "https://energyweb-rpc.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Cortex",
    value: "cortex",
    chainId: 1024,
    icon: "/icons/cortex.svg",
    rpcUrls: [
      "https://rpc.cortexlabs.ai",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Harmony",
    value: "harmony",
    chainId: 1666600000,
    icon: "/icons/harmony.svg",
    rpcUrls: [
      "https://api.harmony.one",
      "https://harmony.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Dogechain",
    value: "dogechain",
    chainId: 2000,
    icon: "/icons/dogechain.svg",
    rpcUrls: [
      "https://rpc.dogechain.dog",
      "https://dogechain-rpc.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "zkFair",
    value: "zkfair",
    chainId: 42766,
    icon: "/icons/zkfair.svg",
    rpcUrls: [
      "https://rpc.zkfair.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Flare",
    value: "flare",
    chainId: 14,
    icon: "/icons/flare.svg",
    rpcUrls: [
      "https://flare-api.flare.network/ext/C/rpc",
      "https://flare-rpc.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Gnosis",
    value: "gnosis",
    chainId: 100,
    icon: "/icons/gnosis.svg",
    rpcUrls: [
      "https://rpc.gnosischain.com",
      "https://gnosis.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Callisto",
    value: "callisto",
    chainId: 820,
    icon: "/icons/callisto.svg",
    rpcUrls: [
      "https://rpc.callisto.network",
      "https://callisto-rpc.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },

        {
    label: "Kava",
    value: "kava",
    chainId: 2222,
    icon: "/icons/kava.svg",
    rpcUrls: [
      "https://evm.kava.io",
      "https://kava-rpc.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "OKC",
    value: "okc",
    chainId: 66,
    icon: "/icons/okc.svg",
    rpcUrls: [
      "https://exchainrpc.okex.org",
      "https://okc-rpc.publicnode.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Theta",
    value: "theta",
    chainId: 361,
    icon: "/icons/theta.svg",
    rpcUrls: [
      "https://eth-rpc-api.thetatoken.org/rpc",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Bitgert",
    value: "brise",
    chainId: 32520,
    icon: "/icons/bitgert.svg",
    rpcUrls: [
      "https://rpc.icecreamswap.com",
      "https://mainnet-rpc.brisescan.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Velas",
    value: "velas",
    chainId: 106,
    icon: "/icons/velas.svg",
    rpcUrls: [
      "https://evmexplorer.velas.com/rpc",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Wanchain",
    value: "wan",
    chainId: 888,
    icon: "/icons/wan.svg",
    rpcUrls: [
      "https://gwan-ssl.wandevs.org:56891",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Findora",
    value: "findora",
    chainId: 2152,
    icon: "/icons/findora.svg",
    rpcUrls: [
      "https://evm.findorascan.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Ubiq",
    value: "ubiq",
    chainId: 8,
    icon: "/icons/ubiq.svg",
    rpcUrls: [
      "https://rpc.octano.dev",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Meter",
    value: "meter",
    chainId: 82,
    icon: "/icons/meter.svg",
    rpcUrls: [
      "https://rpc.meter.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Oasis Emerald",
    value: "oasis",
    chainId: 42262,
    icon: "/icons/oasis.svg",
    rpcUrls: [
      "https://emerald.oasis.dev",
      "https://rpc.oasis.oasisprotocol.org",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },

        {
    label: "Canto",
    value: "canto",
    chainId: 7700,
    icon: "/icons/canto.svg",
    rpcUrls: [
      "https://canto.gravitychain.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Callisto",
    value: "callisto",
    chainId: 820,
    icon: "/icons/callisto.svg",
    rpcUrls: [
      "https://rpc.callisto.network",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "KardiaChain",
    value: "kardia",
    chainId: 24,
    icon: "/icons/kardia.svg",
    rpcUrls: [
      "https://rpc.kardiachain.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "TomoChain",
    value: "tomo",
    chainId: 88,
    icon: "/icons/tomo.svg",
    rpcUrls: [
      "https://rpc.tomochain.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Elysium",
    value: "elysium",
    chainId: 1339,
    icon: "/icons/elysium.svg",
    rpcUrls: [
      "https://elysium-rpc.metachain.asia",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Energi",
    value: "energi",
    chainId: 39797,
    icon: "/icons/energi.svg",
    rpcUrls: [
      "https://nodeapi.energi.network",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Luxy",
    value: "luxy",
    chainId: 9924,
    icon: "/icons/luxy.svg",
    rpcUrls: [
      "https://rpc.luxy.io",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Exosama",
    value: "exosama",
    chainId: 2109,
    icon: "/icons/exosama.svg",
    rpcUrls: [
      "https://rpc.exosama.com",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },

        {
    label: "Sapphire",
    value: "sapphire",
    chainId: 23294,
    icon: "/icons/sapphire.svg",
    rpcUrls: [
      "https://rpc.sapphire.oasis.io",
    ],
    fallbackGas: ethers.parseUnits("0.001", "ether"),
  },
  {
    label: "Clover",
    value: "clover",
    chainId: 1024,
    icon: "/icons/clover.svg",
    rpcUrls: [
      "https://rpc.clover.finance",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Rootstock",
    value: "rsk",
    chainId: 30,
    icon: "/icons/rsk.svg",
    rpcUrls: [
      "https://public-node.rsk.co",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Fusion",
    value: "fusion",
    chainId: 32659,
    icon: "/icons/fusion.svg",
    rpcUrls: [
      "https://mainnet.anyswap.exchange",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "DFK Chain",
    value: "dfk",
    chainId: 53935,
    icon: "/icons/dfk.svg",
    rpcUrls: [
      "https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
  {
    label: "Theta Testnet",
    value: "theta-testnet",
    chainId: 365,
    icon: "/icons/theta.svg",
    rpcUrls: [
      "https://eth-rpc-api-testnet.thetatoken.org/rpc",
    ],
    fallbackGas: ethers.parseUnits("0.002", "ether"),
  },
];

export function getFallbackProviderByValue(value) {
  const net = networks.find(
    (n) => n.value === value || n.testnet?.value === value
  );
  if (!net) throw new Error(`[networks] ❌ Unknown network value: ${value}`);

  const rpcUrls = net.value === value ? net.rpcUrls : net.testnet?.rpcUrls;
  if (!rpcUrls?.length)
    throw new Error(`[networks] ❌ No RPC URLs found for value: ${value}`);

  return new FallbackProvider(rpcUrls.map((url) => new JsonRpcProvider(url)));
}

export default networks;
