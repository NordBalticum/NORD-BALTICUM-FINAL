"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";
import { startSessionWatcher } from "@/utils/sessionWatcher";
import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading, safeRefreshSession, signOut } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, loading: balancesLoading, refetch } = useBalance();

  const [latencyMs, setLatencyMs] = useState(0);
  const [sessionScore, setSessionScore] = useState(100);

  const isClient = typeof window !== "undefined";
  const isDomReady = typeof document !== "undefined" && document.readyState === "complete";

  const intervalRef = useRef(null);
  const sessionWatcher = useRef(null);
  const lastRefreshTime = useRef(Date.now());

  const minimalReady = useMemo(() =>
    isClient &&
    isDomReady &&
    !!user?.email &&
    !!wallet?.wallet?.address &&
    !!activeNetwork &&
    !authLoading &&
    !walletLoading,
    [user, wallet, activeNetwork, authLoading, walletLoading, isClient, isDomReady]
  );

  const hasBalancesReady = useMemo(() =>
    !balancesLoading &&
    balances &&
    Object.keys(balances || {}).length >= 0,
    [balances, balancesLoading]
  );

  const ready = minimalReady && hasBalancesReady;
  const loading = !ready;

  // Session Score
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

  // Debounced refresh on visibility & network online
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    const refresh = async (trigger) => {
      const start = performance.now();
      try {
        await safeRefreshSession?.();
        await refetch?.();
        setLatencyMs(Math.round(performance.now() - start));
        lastRefreshTime.current = Date.now();
        console.log(`✅ Refresh complete [${trigger}]`);
      } catch (error) {
        console.error(`❌ Refresh failed [${trigger}]:`, error.message);
      }
    };

    const onVisible = debounce(() => refresh("tab-visible"), 300);
    const onOnline = debounce(() => refresh("network-online"), 300);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [minimalReady, safeRefreshSession, refetch]);

  // Auto refresh kas 5min (tikrinama kas 30s)
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    intervalRef.current = setInterval(() => {
      if (Date.now() - lastRefreshTime.current >= 5 * 60 * 1000) {
        console.log("⏳ Auto refresh triggered (5min)");
        safeRefreshSession?.();
        refetch?.();
      }
    }, 30000);

    return () => clearInterval(intervalRef.current);
  }, [minimalReady, safeRefreshSession, refetch]);

  // SessionWatcher: API + network + wake + visibility
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    sessionWatcher.current = startSessionWatcher({
      onSessionInvalid: () => {
        toast.error("⚠️ Session invalid or expired. Logging out.");
        signOut?.(true);
      },
      user,
      wallet,
      refreshSession: safeRefreshSession,
      refetchBalances: refetch,
      log: true,
      intervalMs: 60000,
      networkFailLimit: 3,
    });

    sessionWatcher.current.start();

    return () => {
      sessionWatcher.current?.stop?.();
    };
  }, [isClient, minimalReady, user, wallet, safeRefreshSession, refetch, signOut]);

  return {
    ready,
    loading,
    latencyMs,
    sessionScore,
  };
}
