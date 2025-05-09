"use client";

/**
 * useTokenTransferHistory — MetaMask-grade ERC20 Transfer History
 * ================================================================
 * Grąžina naudotojo adresui susijusius ERC20 tokenų pervedimus.
 * Naudoja explorer API (Etherscan, BscScan ir pan.), automatiškai filtruoja admin fee.
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getNetworkByChainId } from "@/data/networks";
import { EXPLORER_BASES, API_KEYS } from "@/utils/networksApi";

export function useTokenTransferHistory(chainId, tokenAddress) {
  const { getPrimaryAddress } = useAuth();

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransfers = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!chainId || !tokenAddress) throw new Error("Missing chainId or tokenAddress");

        const address = getPrimaryAddress();
        if (!address) throw new Error("Wallet address unavailable");

        const network = getNetworkByChainId(chainId);
        const base = EXPLORER_BASES[network?.explorerApi];
        const apiKey = API_KEYS[network?.explorerApi];
        const admin = (network?.adminAddress || process.env.NEXT_PUBLIC_ADMIN_WALLET || "").toLowerCase();

        if (!base || !apiKey) throw new Error("Explorer API unavailable");

        const url = new URL(base);
        url.searchParams.set("module", "account");
        url.searchParams.set("action", "tokentx");
        url.searchParams.set("contractaddress", tokenAddress);
        url.searchParams.set("address", address);
        url.searchParams.set("startblock", "0");
        url.searchParams.set("endblock", "99999999");
        url.searchParams.set("sort", "desc");
        url.searchParams.set("apikey", apiKey);

        const res = await fetch(url.toString());
        const data = await res.json();

        if (data.status !== "1" || !Array.isArray(data.result)) {
          throw new Error(data.message || "No token transfers found");
        }

        // Filtruojame: neįtraukiame admin fee tipo įrašų
        const filtered = data.result.filter((tx) => {
          const to = tx.to?.toLowerCase();
          return to !== admin;
        });

        setTransfers(filtered);
      } catch (err) {
        console.warn("❌ useTokenTransferHistory:", err.message);
        setError(err.message || "Failed to load token transfers");
        setTransfers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, [chainId, tokenAddress, getPrimaryAddress]);

  return {
    transfers, // Array of token transfers
    loading,   // Indicates if the data is being fetched
    error,     // Error message if the data fetch fails
  };
}
