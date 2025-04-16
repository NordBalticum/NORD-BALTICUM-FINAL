"use client";

export const fetchNetworkTransactions = async (network, address) => {
  if (!address) return [];

  const API_KEYS = {
    bnb: process.env.NEXT_PUBLIC_BSCSCAN_API_KEY,
    tbnb: process.env.NEXT_PUBLIC_TBSCSCAN_API_KEY,
    eth: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
    polygon: process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY,
    avax: "",
  };

  const API_URLS = {
    bnb: "https://api.bscscan.com/api",
    tbnb: "https://api-testnet.bscscan.com/api",
    eth: "https://api.etherscan.io/api",
    polygon: "https://api.polygonscan.com/api",
    avax: "https://api.snowtrace.io/api",
  };

  const url = new URL(API_URLS[network]);
  url.searchParams.append("module", "account");
  url.searchParams.append("action", "txlist");
  url.searchParams.append("address", address);
  url.searchParams.append("startblock", "0");
  url.searchParams.append("endblock", "99999999");
  url.searchParams.append("sort", "desc");
  if (API_KEYS[network]) {
    url.searchParams.append("apikey", API_KEYS[network]);
  }

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== "1") {
    throw new Error(data.message || "Failed to fetch transactions");
  }

  const result = data.result || [];

  // === 100% TEISINGAS FILTRAVIMAS ===
  const adminWallet = (process.env.NEXT_PUBLIC_ADMIN_WALLET || "").toLowerCase();

  const cleanTxs = result.filter((tx) => {
    const from = tx.from?.toLowerCase();
    const to = tx.to?.toLowerCase();
    const isAdminFee = from === address.toLowerCase() && to === adminWallet;
    return !isAdminFee;
  });

  return cleanTxs;
};
