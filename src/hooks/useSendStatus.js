// src/hooks/useSendStatus.js
"use client";

import { useState, useEffect } from "react";
import { getProviderForChain } from "@/utils/getProviderForChain";

/**
 * Sekti transakcijos statusą su retry, backoff ir replaced detection.
 *
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - chainId, kuriame siųsta
 * @returns { status, loading, confirmed, dropped, replaced, error }
 */
export function useSendStatus(txHash, chainId) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [dropped, setDropped] = useState(false);
  const [replaced, setReplaced] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | pending | confirmed | dropped | replaced | failed

  useEffect(() => {
    if (!txHash || !chainId) return;

    const provider = getProviderForChain(chainId);
    let cancelled = false;

    const checkTransaction = async () => {
      setLoading(true);
      setStatus("pending");

      const maxRetries = 6;
      let retry = 0;

      while (retry < maxRetries && !cancelled) {
        try {
          const receipt = await Promise.race([
            provider.waitForTransaction(txHash, 1),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("⏱️ Timeout")), 30000 + retry * 5000)
            )
          ]);

          if (cancelled) return;

          if (receipt && receipt.status === 1) {
            setConfirmed(true);
            setStatus("confirmed");
            setLoading(false);
            return;
          } else if (receipt && receipt.status === 0) {
            setError("❌ Transaction reverted");
            setStatus("failed");
            setLoading(false);
            return;
          }
        } catch (err) {
          retry++;
          console.warn(`⏳ Retry ${retry}/${maxRetries} —`, err.message);

          // Retry exhausted
          if (retry >= maxRetries) {
            try {
              const tx = await provider.getTransaction(txHash);
              if (!tx || tx.blockNumber == null) {
                setDropped(true);
                setStatus("dropped");
                setError("⚠️ Transaction dropped (not mined)");
              } else if (tx?.replacedByAnotherTransaction) {
                setReplaced(true);
                setStatus("replaced");
                setError("⚠️ Transaction replaced");
              } else {
                setError("❌ Transaction timeout or failed");
                setStatus("failed");
              }
            } catch (finalErr) {
              setError(finalErr.message || "❌ Unknown final error");
              setStatus("failed");
            }

            setLoading(false);
            return;
          }

          await new Promise((res) =>
            setTimeout(res, 1000 * Math.pow(2, retry))
          );
        }
      }

      setLoading(false);
    };

    checkTransaction();

    return () => {
      cancelled = true;
    };
  }, [txHash, chainId]);

  return { status, loading, confirmed, dropped, replaced, error };
}
