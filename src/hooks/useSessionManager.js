"use client";

import { useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";

export function useSessionManager() {
  const { ready } = useSystemReady();
  const { signOut, safeRefreshSession } = useAuth();
  const { refetch } = useBalance();
  const failureCount = useRef(0);
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    if (!ready) return;

    const run = async (source) => {
      try {
        await safeRefreshSession();
        await refetch();
        failureCount.current = 0;
        lastRefresh.current = Date.now();
        console.log(`[SessionManager] Refreshed via ${source}`);
      } catch (err) {
        failureCount.current++;
        console.error(`[SessionManager] Refresh error: ${err.message}`);
        if (failureCount.current >= 3) {
          toast.error("⚠️ Session expired. Logging out...");
          signOut(true);
        }
      }
    };

    const onVisibilityChange = debounce(() => {
      if (document.visibilityState === "visible") run("visibility");
    }, 300);

    const onFocus = debounce(() => run("focus"), 300);
    const onOnline = debounce(() => run("online"), 300);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    const interval = setInterval(() => {
      if (Date.now() - lastRefresh.current > 30_000) { // kas 30 sekundžių
        run("interval");
      }
    }, 30_000);

    return () => {
      onVisibilityChange.cancel();
      onFocus.cancel();
      onOnline.cancel();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [ready, safeRefreshSession, refetch, signOut]);
}
