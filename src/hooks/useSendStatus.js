"use client";

/**
 * useSendStatus v2.0 — Final MetaMask-Grade TX Status Tracker
 * ============================================================
 * • Full tx lifecycle tracking with retry + exponential backoff
 * • Detects: confirmed, failed, dropped, replaced
 * • Uses both provider.waitForTransaction and manual fallback
 */

import { useEffect, useState } from "react";
import { getProviderForChain } from "@/utils/getProviderForChain";

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

    const checkStatus = async () => {
      setLoading(true);
      setStatus("pending");

      const MAX_RETRIES = 6;
      let retry = 0;

      while (retry < MAX_RETRIES && !cancelled) {
        try {
          const timeout = 30000 + retry * 5000;

          const receipt = await Promise.race([
            provider.waitForTransaction(txHash, 1),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("⏱️ Timeout")), timeout)
            ),
          ]);

          if (cancelled) return;

          if (receipt?.status === 1) {
            setConfirmed(true);
            setStatus("confirmed");
            break;
          }

          if (receipt?.status === 0) {
            setStatus("failed");
            setError("❌ Transaction reverted");
            break;
          }
        } catch (err) {
          retry++;
          console.warn(`[useSendStatus] Retry ${retry}/${MAX_RETRIES} — ${err.message}`);

          if (retry >= MAX_RETRIES) {
            try {
              const tx = await provider.getTransaction(txHash);

              if (!tx || tx.blockNumber == null) {
                setDropped(true);
                setStatus("dropped");
                setError("⚠️ Transaction dropped (not mined)");
              } else if (tx?.replacementTx) {
                setReplaced(true);
                setStatus("replaced");
                setError("⚠️ Transaction replaced");
              } else {
                setStatus("failed");
                setError("❌ Transaction stuck or failed");
              }
            } catch (finalErr) {
              setStatus("failed");
              setError(finalErr.message || "❌ Unknown final tx error");
            }
            break;
          }

          await new Promise((r) => setTimeout(r, 1000 * 2 ** retry)); // exponential backoff
        }
      }

      if (!cancelled) setLoading(false);
    };

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [txHash, chainId]);

  return {
    status,
    loading,
    confirmed,
    dropped,
    replaced,
    error,
  };
}
