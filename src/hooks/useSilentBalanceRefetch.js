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
  const lastOnlineSpeed = useRef("unknown");
  const heartbeatTimer = useRef(null);
  const isOffline = useRef(false);

  useEffect(() => {
    if (!ready) return;

    const run = async (source) => {
      if (isOffline.current) {
        console.warn(`[SilentBalanceRefetch] Skipped fetch, offline [${source}]`);
        return;
      }

      try {
        await refetch();
        console.log(`[SilentBalanceRefetch] ✅ Refetched via ${source}`);
        resetRetries();
      } catch (err) {
        console.error(`[SilentBalanceRefetch] ❌ Refetch error via ${source}:`, err?.message || err);
        scheduleRetry();
      }
    };

    const resetRetries = () => {
      retryCount.current = 0;
      retryQueue.current.forEach(clearTimeout);
      retryQueue.current = [];
    };

    const getNetworkSpeed = () => {
      if (navigator.connection?.effectiveType) {
        return navigator.connection.effectiveType; // 4g, 3g, 2g, slow-2g
      }
      return "unknown";
    };

    const getDelay = () => {
      const baseDelay = 3000;
      const exponential = Math.min(2 ** retryCount.current * baseDelay, 60000); // max 60s
      if (lastOnlineSpeed.current.includes("2g") || lastOnlineSpeed.current.includes("slow")) {
        return exponential * 1.5;
      }
      return exponential;
    };

    const scheduleRetry = () => {
      if (retryCount.current >= 6) {
        console.error("[SilentBalanceRefetch] ❌ Max retries reached. Stopping retries.");
        return;
      }

      const delay = getDelay();
      console.warn(`[SilentBalanceRefetch] 🔁 Retrying in ${Math.round(delay / 1000)}s...`);

      const id = setTimeout(() => {
        if (!isOffline.current) run("retry");
      }, delay);

      retryQueue.current.push(id);
      retryCount.current++;
    };

    const onVisibilityChange = debounce(() => {
      if (document.visibilityState === "visible") run("visibility");
    }, 300);

    const onFocus = debounce(() => run("focus"), 300);

    const onOnline = debounce(() => {
      console.log("[SilentBalanceRefetch] 📶 Back online");
      isOffline.current = false;
      lastOnlineSpeed.current = getNetworkSpeed();
      run("online");
    }, 300);

    const onOffline = debounce(() => {
      console.warn("[SilentBalanceRefetch] 🔌 Offline detected");
      isOffline.current = true;
    }, 300);

    const wakeLockCheck = debounce(() => {
      if (document.visibilityState === "visible") run("wake-up");
    }, 300);

    heartbeatTimer.current = setInterval(() => {
      if (!isOffline.current) {
        console.log("[SilentBalanceRefetch] 💓 Heartbeat refetch");
        run("heartbeat");
      }
    }, 120_000); // kas 2 minutes

    const interval = setInterval(() => {
      if (!isOffline.current) {
        lastOnlineSpeed.current = getNetworkSpeed();
        run("interval");
      }
    }, 30_000); // kas 30 sekundžių

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("resume", wakeLockCheck);

    return () => {
      retryQueue.current.forEach(clearTimeout);
      retryQueue.current = [];

      onVisibilityChange.cancel();
      onFocus.cancel();
      onOnline.cancel();
      onOffline.cancel();
      wakeLockCheck.cancel();

      clearInterval(interval);
      clearInterval(heartbeatTimer.current);

      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("resume", wakeLockCheck);
    };
  }, [ready, refetch]);
}
