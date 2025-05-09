"use client";

/**
 * useNativeTransferHistory — MetaMask-grade natyvių (ETH, MATIC, BNB...) pervedimų istorija
 * ==========================================================================================
 * Veikia 36+ EVM tinklų, grąžina TIK naudotojo pervedimus, automatiškai filtruoja admin mokesčius.
 * - Explorer API palaikymas (Etherscan, BscScan ir kt.)
 * - Integracija su `networks.js` ir `AuthContext`
 * - Deploy-ready su klaidų valdymu
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getNetworkByChainId } from "@/data/networks";
import { EXPLORER_BASES, API_KEYS } from "@/utils/networksApi";

export function useNativeTransferHistory(chainId) {
  const { getPrimaryAddress } = useAuth();

  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTxs = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!chainId) throw new Error("Missing chainId");
        const address = getPrimaryAddress();
        if (!address) throw new Error("Wallet address unavailable");

        const net = getNetworkByChainId(chainId);
        const explorer = net?.explorerApi;
        const base = EXPLORER_BASES[explorer];
        const apiKey = API_KEYS[explorer];

        if (!base || !explorer || !apiKey) {
          throw new Error("Explorer not supported for this network");
        }

        const url = new URL(base);
        url.searchParams.set("module", "account");
        url.searchParams.set("action", "txlist");
        url.searchParams.set("address", address);
        url.searchParams.set("startblock", "0");
        url.searchParams.set("endblock", "99999999");
        url.searchParams.set("sort", "desc");
        url.searchParams.set("apikey", apiKey);

        const res = await fetch(url.toString());
        const data = await res.json();

        if (data.status !== "1" || !Array.isArray(data.result)) {
          throw new Error(data.message || "No transactions found");
        }

        const admin = (process.env.NEXT_PUBLIC_ADMIN_WALLET || "").toLowerCase();
        const lowerAddr = address.toLowerCase();

        // ❌ Nerodyti admin fee ir nenaudingų self-transfers
        const filtered = data.result.filter((tx) => {
          const from = tx.from?.toLowerCase();
          const to = tx.to?.toLowerCase();
          const isAdminTx = from === lowerAddr && to === admin;
          const isMeaningless = from === to;
          return !isAdminTx && !isMeaningless;
        });

        setTxs(filtered);
      } catch (err) {
        console.warn("❌ useNativeTransferHistory error:", err.message);
        setError(err.message);
        setTxs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTxs();
  }, [chainId, getPrimaryAddress]);

  return {
    txs,       // Array of native transactions (filtered)
    loading,   // boolean
    error,     // string|null
  };
}
