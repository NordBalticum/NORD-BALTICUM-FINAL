// src/utils/networksApi.js
"use client";

import networks, { getNetworkByChainId } from "@/data/networks";

const EXPLORER_BASES = {
  etherscan: "https://api.etherscan.io/api",
  bscscan: "https://api.bscscan.com/api",
  polygonscan: "https://api.polygonscan.com/api",
  snowtrace: "https://api.snowtrace.io/api",
  arbiscan: "https://api.arbiscan.io/api",
  ftmscan: "https://api.ftmscan.com/api",
  celoscan: "https://api.celoscan.io/api",
  basescan: "https://api.basescan.org/api",
  moonscan: "https://api-moonbeam.moonscan.io/api",
};

const API_KEYS = {
  etherscan: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
  bscscan: process.env.NEXT_PUBLIC_BSCSCAN_API_KEY,
  polygonscan: process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY,
  snowtrace: process.env.NEXT_PUBLIC_SNOWTRACE_API_KEY,
  arbiscan: process.env.NEXT_PUBLIC_ARBISCAN_API_KEY,
  ftmscan: process.env.NEXT_PUBLIC_FTMSCAN_API_KEY,
  celoscan: process.env.NEXT_PUBLIC_CELOSCAN_API_KEY,
  basescan: process.env.NEXT_PUBLIC_BASESCAN_API_KEY,
  moonscan: process.env.NEXT_PUBLIC_MOONSCAN_API_KEY,
};

/**
 * Gauti transakcijų sąrašą bet kuriam EVM adresui + tinklui
 * @param {number} chainId
 * @param {string} address
 * @returns {Promise<Array>}
 */
export async function fetchNetworkTransactions(chainId, address) {
  if (!address || !chainId) return [];

  const network = getNetworkByChainId(chainId);
  if (!network?.explorerApi) return [];

  const baseUrl = EXPLORER_BASES[network.explorerApi];
  const apiKey = API_KEYS[network.explorerApi];

  if (!baseUrl) {
    console.warn(`[networksApi] No explorer API for chainId ${chainId}`);
    return [];
  }

  const url = new URL(baseUrl);
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "txlist");
  url.searchParams.set("address", address);
  url.searchParams.set("startblock", "0");
  url.searchParams.set("endblock", "99999999");
  url.searchParams.set("sort", "desc");
  if (apiKey) url.searchParams.set("apikey", apiKey);

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
    console.warn(`❌ [networksApi] Fetch error (${chainId}):`, err.message);
    return [];
  }
}
