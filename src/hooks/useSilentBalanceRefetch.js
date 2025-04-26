"use client";

import { useEffect } from "react";
import debounce from "lodash.debounce";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";

export function useSilentBalanceRefetch() {
  const { ready } = useSystemReady();
  const { refetch } = useBalance();

  useEffect(() => {
    if (!ready) return;

    const run = async (source) => {
      try {
        await refetch();
        console.log(`[SilentBalanceRefetch] Refetched via ${source}`);
      } catch (err) {
        console.error(`[SilentBalanceRefetch] Refetch error:`, err?.message || err);
      }
    };

    const onVisibilityChange = debounce(() => {
      if (document.visibilityState === "visible") {
        run("visibility");
      }
    }, 300);

    const onFocus = debounce(() => run("focus"), 300);
    const onOnline = debounce(() => run("online"), 300);

    const wakeLockCheck = debounce(() => {
      if (document.visibilityState === "visible") {
        run("wake-up");
      }
    }, 300);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    // (Optional) wake lock / hibernation recovery
    document.addEventListener("resume", wakeLockCheck); // sometimes fired by system

    const interval = setInterval(() => {
      run("interval"); // kas 30s automatiškai
    }, 30_000);

    return () => {
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
