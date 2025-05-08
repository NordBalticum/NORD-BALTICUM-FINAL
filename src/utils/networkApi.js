"use client";

import networks from "@/data/networks";

const EXPLORER_APIS = {
  etherscan: "https://api.etherscan.io/api",
  bscscan: "https://api.bscscan.com/api",
  polygonscan: "https://api.polygonscan.com/api",
  snowtrace: "https://api.snowtrace.io/api",
  arbiscan: "https://api.arbiscan.io/api",
  ftmscan: "https://api.ftmscan.com/api",
  moonscan: "https://api-moonbeam.moonscan.io/api",
  celoscan: "https://api.celoscan.io/api",
  basescan: "https://api.basescan.org/api",
  blasts: "https://api.routescan.io/v2/network/mainnet/evm/8453/etherscan/api",
};

const API_KEYS = {
  etherscan: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
  bscscan: process.env.NEXT_PUBLIC_BSCSCAN_API_KEY,
  polygonscan: process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY,
  snowtrace: process.env.NEXT_PUBLIC_SNOWTRACE_API_KEY,
  arbiscan: process.env.NEXT_PUBLIC_ARBISCAN_API_KEY,
  ftmscan: process.env.NEXT_PUBLIC_FTMSCAN_API_KEY,
  moonscan: process.env.NEXT_PUBLIC_MOONSCAN_API_KEY,
  celoscan: process.env.NEXT_PUBLIC_CELOSCAN_API_KEY,
  basescan: process.env.NEXT_PUBLIC_BASESCAN_API_KEY,
  blasts: process.env.NEXT_PUBLIC_BLASTSCAN_API_KEY,
};

function getApiInfo(chainId) {
  const network = networks.find((n) => n.chainId === chainId);
  if (!network || !network.explorerApi) return null;

  const baseUrl = EXPLORER_APIS[network.explorerApi];
  const apiKey = API_KEYS[network.explorerApi];

  return { baseUrl, apiKey };
}

/**
 * Gauti transakcijų sąrašą bet kuriam EVM adresui + tinklui
 * @param {number} chainId
 * @param {string} address
 * @returns {Promise<Array>}
 */
export async function fetchNetworkTransactions(chainId, address) {
  if (!address || !chainId) return [];

  const api = getApiInfo(chainId);
  if (!api?.baseUrl) return [];

  const url = new URL(api.baseUrl);
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "txlist");
  url.searchParams.set("address", address);
  url.searchParams.set("startblock", "0");
  url.searchParams.set("endblock", "99999999");
  url.searchParams.set("sort", "desc");
  if (api.apiKey) url.searchParams.set("apikey", api.apiKey);

  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.status !== "1") throw new Error(data.message || "Explorer error");

    const admin = (process.env.NEXT_PUBLIC_ADMIN_WALLET || "").toLowerCase();
    return (data.result || []).filter((tx) => {
      const from = tx.from?.toLowerCase();
      const to = tx.to?.toLowerCase();
      return !(from === address.toLowerCase() && to === admin);
    });
  } catch (err) {
    console.warn("❌ Transaction fetch error:", err.message);
    return [];
  }
}
