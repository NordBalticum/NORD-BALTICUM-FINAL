"use client";

import { useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";

export function useSilentBalanceRefetch() {
  const { ready } = useSystemReady();
  const { refetch } = useBalance();
  const retryQueue = useRef([]);
  const retryCount = useRef(0);

  useEffect(() => {
    if (!ready) return;

    const run = async (source) => {
      try {
        await refetch();
        console.log(`[SilentBalanceRefetch] Refetched via ${source}`);
        retryCount.current = 0; // Reset retry count on success
        retryQueue.current.forEach(clearTimeout);
        retryQueue.current = [];
      } catch (err) {
        console.error(`[SilentBalanceRefetch] Refetch error: ${err?.message || err}`);
        scheduleRetry();
      }
    };

    const scheduleRetry = () => {
      if (retryCount.current >= 6) {
        console.error("[SilentBalanceRefetch] ❌ Max retries reached. No further retries.");
        return;
      }

      const delay = Math.min(2 ** retryCount.current * 3000, 60000); 
      // 3s -> 6s -> 12s -> 24s -> 48s -> 60s max (stabilized)

      console.warn(`[SilentBalanceRefetch] Retrying in ${Math.round(delay / 1000)}s`);
      
      const id = setTimeout(async () => {
        try {
          await refetch();
          console.log("[SilentBalanceRefetch] Retry successful ✅");
          retryCount.current = 0;
          retryQueue.current.forEach(clearTimeout);
          retryQueue.current = [];
        } catch (err) {
          console.error("[SilentBalanceRefetch] Retry failed ❌:", err?.message || err);
          retryCount.current++;
          scheduleRetry();
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
