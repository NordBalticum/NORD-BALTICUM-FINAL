// utils/networks.js

export const supportedNetworks = [
  {
    name: "BNB Chain",
    symbol: "bsc",
    route: "/bnb",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    explorer: "https://bscscan.com/tx/",
  },
  {
    name: "BNB Testnet",
    symbol: "tbnb",
    route: "/tbnb",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    explorer: "https://testnet.bscscan.com/tx/",
  },
  {
    name: "Ethereum",
    symbol: "eth",
    route: "/eth",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    explorer: "https://etherscan.io/tx/",
  },
  {
    name: "Polygon",
    symbol: "polygon",
    route: "/matic",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    explorer: "https://polygonscan.com/tx/",
  },
  {
    name: "Avalanche",
    symbol: "avax",
    route: "/avax",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
    explorer: "https://snowtrace.io/tx/",
  },
];

// Papildoma pagalba
export const getNetworkBySymbol = (symbol) =>
  supportedNetworks.find((n) => n.symbol === symbol?.toLowerCase());

export const getExplorerLink = (symbol, txHash) => {
  const network = getNetworkBySymbol(symbol);
  return network?.explorer ? `${network.explorer}${txHash}` : null;
};
