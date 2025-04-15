"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";
import { startSessionWatcher } from "@/utils/sessionWatcher";
import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

// ✅ SYSTEM READY – full protection
export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading, safeRefreshSession, signOut } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, loading: balancesLoading, refetch } = useBalance();

  const [latencyMs, setLatencyMs] = useState(0);
  const [sessionScore, setSessionScore] = useState(100);

  const sessionWatcher = useRef(null);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(false);
  const lastRefreshTime = useRef(Date.now());

  const isClient = typeof window !== "undefined";
  const isDomReady = typeof document !== "undefined" && document.readyState === "complete";

  // ✅ Minimal readiness
  const minimalReady = useMemo(
    () =>
      isClient &&
      isDomReady &&
      !!user?.email &&
      !!wallet?.wallet?.address &&
      !!activeNetwork &&
      !authLoading &&
      !walletLoading,
    [user, wallet, activeNetwork, authLoading, walletLoading, isClient, isDomReady]
  );

  // ✅ Balances readiness
  const hasBalancesReady = useMemo(
    () => !balancesLoading && balances && Object.keys(balances || {}).length >= 0,
    [balances, balancesLoading]
  );

  const ready = minimalReady && hasBalancesReady;
  const loading = !ready;

  // ✅ Internal diagnostics
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    const score =
      100 -
      (authLoading ? 20 : 0) -
      (walletLoading ? 20 : 0) -
      (!user ? 30 : 0) -
      (!wallet?.wallet?.address ? 30 : 0);

    setSessionScore(Math.max(0, score));
  }, [minimalReady, authLoading, walletLoading, user, wallet]);

  // ✅ Debounced handlers
  const handlers = useMemo(() => {
    const handleRefresh = async (trigger = "unknown") => {
      if (!minimalReady || !safeRefreshSession || !refetch) return;

      const start = performance.now();
      console.log(`⏳ Refresh started [${trigger}]...`);

      try {
        await safeRefreshSession();
        await refetch();
        setLatencyMs(Math.round(performance.now() - start));
        lastRefreshTime.current = Date.now();
        console.log(`✅ Refresh complete [${trigger}] (${latencyMs}ms)`);
      } catch (error) {
        console.error(`❌ ${trigger} refresh error:`, error.message);
      }
    };

    return {
      onVisible: debounce(() => handleRefresh("tab-visible"), 500),
      onOnline: debounce(() => handleRefresh("network-online"), 500),
    };
  }, [minimalReady, safeRefreshSession, refetch]);

  // ✅ Visibility & network handlers
  useEffect(() => {
    if (!isClient) return;

    document.addEventListener("visibilitychange", handlers.onVisible);
    window.addEventListener("online", handlers.onOnline);

    return () => {
      document.removeEventListener("visibilitychange", handlers.onVisible);
      window.removeEventListener("online", handlers.onOnline);
    };
  }, [handlers, isClient]);

  // ✅ Auto refresh kas 5 min
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    intervalRef.current = setInterval(() => {
      if (Date.now() - lastRefreshTime.current >= 5 * 60 * 1000) {
        console.log("⏳ Auto refresh (5min)");
        safeRefreshSession?.();
        refetch?.();
      }
    }, 30000); // tikrinam kas 30s

    return () => clearInterval(intervalRef.current);
  }, [minimalReady, safeRefreshSession, refetch, isClient]);

  // ✅ SessionWatcher + network fallback
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    sessionWatcher.current = startSessionWatcher({
      onSessionInvalid: () => {
        toast.error("⚠️ Session invalid or network down. Logging out.");
        signOut?.(true);
      },
      intervalMs: 60000,
      networkFailLimit: 3,
    });

    sessionWatcher.current.start();

    return () => {
      sessionWatcher.current?.stop?.();
    };
  }, [isClient, minimalReady, signOut]);

  // ✅ Final debug
  useEffect(() => {
    if (!isClient || !ready) return;
    console.log("[useSystemReady] ✅ System is fully READY");
  }, [ready]);

  return {
    ready,
    loading,
    latencyMs,
    sessionScore,
  };
}
