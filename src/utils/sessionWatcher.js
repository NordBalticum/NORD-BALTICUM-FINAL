"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import debounce from "lodash.debounce";

export function useSessionManager() {
  const { user, wallet, safeRefreshSession, signOut } = useAuth();
  const { refetch } = useBalance();
  const { activeNetwork, chainId } = useNetwork();

  const refreshAttempts = useRef(0);
  const lastRefreshTime = useRef(Date.now());

  const forceRefresh = async (reason = "manual") => {
    try {
      console.log(`[SessionManager] Refresh triggered by: ${reason}`);
      await safeRefreshSession();
      await refetch();
      refreshAttempts.current = 0;
      lastRefreshTime.current = Date.now();
    } catch (err) {
      console.error(`[SessionManager] Refresh failed: ${err.message || err}`);
      refreshAttempts.current++;
      if (refreshAttempts.current >= 3) {
        console.warn("[SessionManager] Too many refresh errors. Logging out...");
        signOut(true);
      }
    }
  };

  useEffect(() => {
    if (!user?.email || !wallet?.wallet?.address || !activeNetwork || !chainId) return;

    const handleVisibilityChange = debounce(() => {
      if (document.visibilityState === "visible") {
        forceRefresh("visibility");
      }
    }, 300);

    const handleFocus = debounce(() => {
      forceRefresh("focus");
    }, 300);

    const handleOnline = debounce(() => {
      forceRefresh("online");
    }, 300);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    const interval = setInterval(() => {
      if (Date.now() - lastRefreshTime.current > 30_000) { // 30s silent check
        forceRefresh("interval");
      }
    }, 30_000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
      handleVisibilityChange.cancel();
      handleFocus.cancel();
      handleOnline.cancel();
    };
  }, [user, wallet, activeNetwork, chainId]);
}
