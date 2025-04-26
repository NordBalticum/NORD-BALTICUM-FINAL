// src/hooks/useSendStatus.js
"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getProviderForChain } from "@/utils/getProviderForChain";

/**
 * Hook'as, kuris seka transakcijos statusą.
 *
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - chainId, kuriame siuntėme
 * @returns { status, loading, confirmed, error }
 */
export function useSendStatus(txHash, chainId) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | pending | confirmed | failed

  useEffect(() => {
    if (!txHash || !chainId) return;

    const provider = getProviderForChain(chainId);
    let cancelled = false;

    async function checkTxStatus() {
      try {
        setLoading(true);
        setStatus("pending");

        const receipt = await provider.waitForTransaction(txHash, 1, 90_000); // timeout: 90s
        if (cancelled) return;

        if (receipt && receipt.status === 1) {
          setConfirmed(true);
          setStatus("confirmed");
        } else {
          setError("Transaction failed");
          setStatus("failed");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("❌ Transaction status error:", err);
        setError(err.message || "Unknown error");
        setStatus("failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkTxStatus();

    return () => {
      cancelled = true;
    };
  }, [txHash, chainId]);

  return { status, loading, confirmed, error };
}
