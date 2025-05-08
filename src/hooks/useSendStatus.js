"use client";

import { useEffect, useState } from "react";
import { getProviderForChain } from "@/utils/getProviderForChain";

/**
 * ✅ Sekti transakcijos statusą (MetaMask-grade) su retry + backoff + dropped/replaced detekcija.
 *
 * @param {string} txHash - Transakcijos hash
 * @param {number} chainId - Tinklo chainId
 * @returns {Object} - { status, loading, confirmed, dropped, replaced, error }
 */
export function useSendStatus(txHash, chainId) {
  const [status, setStatus] = useState("idle"); // idle | pending | confirmed | dropped | replaced | failed
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [dropped, setDropped] = useState(false);
  const [replaced, setReplaced] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!txHash || !chainId) return;

    const provider = getProviderForChain(chainId);
    let cancelled = false;

    const checkTxStatus = async () => {
      setLoading(true);
      setStatus("pending");

      const MAX_RETRIES = 6;
      let retry = 0;

      while (retry < MAX_RETRIES && !cancelled) {
        try {
          const timeoutMs = 30000 + retry * 5000;
          const receipt = await Promise.race([
            provider.waitForTransaction(txHash, 1),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("⏱️ Timeout")), timeoutMs)
            ),
          ]);

          if (cancelled) return;

          if (receipt?.status === 1) {
            setConfirmed(true);
            setStatus("confirmed");
            break;
          } else if (receipt?.status === 0) {
            setError("❌ Transaction reverted");
            setStatus("failed");
            break;
          }
        } catch (err) {
          retry++;
          console.warn(`[useSendStatus] Retry ${retry}/${MAX_RETRIES} —`, err.message);

          if (retry >= MAX_RETRIES) {
            try {
              const tx = await provider.getTransaction(txHash);
              if (!tx || tx.blockNumber == null) {
                setDropped(true);
                setStatus("dropped");
                setError("⚠️ Transaction dropped (not mined)");
              } else if (tx.replacedByAnotherTransaction) {
                setReplaced(true);
                setStatus("replaced");
                setError("⚠️ Transaction replaced");
              } else {
                setStatus("failed");
                setError("❌ Transaction not confirmed");
              }
            } catch (finalErr) {
              setStatus("failed");
              setError(finalErr.message || "❌ Unknown transaction error");
            }
            break;
          }

          await new Promise((r) => setTimeout(r, 1000 * 2 ** retry));
        }
      }

      if (!cancelled) setLoading(false);
    };

    checkTxStatus();
    return () => {
      cancelled = true;
    };
  }, [txHash, chainId]);

  return { status, loading, confirmed, dropped, replaced, error };
}
