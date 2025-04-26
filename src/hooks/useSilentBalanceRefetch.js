"use client";

import { useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";

export function useSilentBalanceRefetch() {
  const { ready } = useSystemReady();
  const { refetch } = useBalance();
  const retryQueue = useRef([]);

  useEffect(() => {
    if (!ready) return;

    const run = async (source) => {
      try {
        await refetch();
        console.log(`[SilentBalanceRefetch] Refetched via ${source}`);
      } catch (err) {
        console.error(`[SilentBalanceRefetch] Refetch error: ${err?.message || err}`);
        queueRetry();
      }
    };

    const queueRetry = () => {
      if (retryQueue.current.length >= 5) return; // Max 5 retry attempts queued
      const delay = (retryQueue.current.length + 1) * 3000; // 3s, 6s, 9s, 12s, 15s
      console.warn(`[SilentBalanceRefetch] Retrying in ${delay / 1000}s`);
      const id = setTimeout(async () => {
        try {
          await refetch();
          console.log("[SilentBalanceRefetch] Retry successful ✅");
          retryQueue.current = []; // Clear all retries after success
        } catch (err) {
          console.error("[SilentBalanceRefetch] Retry failed ❌:", err?.message || err);
        }
      }, delay);
      retryQueue.current.push(id);
    };

    const onVisibilityChange = debounce(() => {
      if (document.visibilityState === "visible") run("visibility");
    }, 300);

    const onFocus = debounce(() => run("focus"), 300);
    const onOnline = debounce(() => run("online"), 300);

    const wakeLockCheck = debounce(() => {
      if (document.visibilityState === "visible") run("wake-up");
    }, 300);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("resume", wakeLockCheck);

    const interval = setInterval(() => {
      run("interval");
    }, 30_000);

    return () => {
      retryQueue.current.forEach(clearTimeout);
      retryQueue.current = [];

      onVisibilityChange.cancel();
      onFocus.cancel();
      onOnline.cancel();
      wakeLockCheck.cancel();
      clearInterval(interval);

      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("resume", wakeLockCheck);
    };
  }, [ready, refetch]);
}
