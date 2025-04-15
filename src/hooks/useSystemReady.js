"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";
import { startSessionWatcher } from "@/utils/sessionWatcher";
import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

// ✅ SYSTEM READY – FINAL VERSION
export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading, safeRefreshSession, signOut } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, loading: balancesLoading, refetch } = useBalance();

  const [latencyMs, setLatencyMs] = useState(0);
  const [sessionScore, setSessionScore] = useState(100);

  const intervalRef = useRef(null);
  const sessionWatcher = useRef(null);
  const lastRefreshTime = useRef(Date.now());

  const isClient = typeof window !== "undefined";
  const isDomReady = typeof document !== "undefined" && document.readyState === "complete";

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

  const hasBalancesReady = useMemo(
    () => !balancesLoading && balances && Object.keys(balances || {}).length >= 0,
    [balances, balancesLoading]
  );

  const ready = minimalReady && hasBalancesReady;
  const loading = !ready;

  // ✅ Internal session diagnostics (100% score based system state)
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

  // ✅ Visibility & network auto-refresh (debounced)
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

    const handleVisible = debounce(() => refresh("tab-visible"), 300);
    const handleOnline = debounce(() => refresh("network-online"), 300);

    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("online", handleOnline);
    };
  }, [minimalReady, safeRefreshSession, refetch]);

  // ✅ Auto refresh kas 5 min
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    intervalRef.current = setInterval(() => {
      if (Date.now() - lastRefreshTime.current >= 5 * 60 * 1000) {
        console.log("⏳ Auto refresh triggered");
        safeRefreshSession?.();
        refetch?.();
      }
    }, 30000); // tikrinam kas 30s

    return () => clearInterval(intervalRef.current);
  }, [minimalReady, safeRefreshSession, refetch]);

  // ✅ NEW SessionWatcher – kaip paprašyta
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    sessionWatcher.current = startSessionWatcher({
      onSessionInvalid: () => {
        toast.error("⚠️ Session invalid or expired. Logging out.");
        signOut?.(true);
      },
      intervalMinutes: 1,
    });

    sessionWatcher.current.start();

    return () => {
      sessionWatcher.current?.stop?.();
    };
  }, [isClient, minimalReady, signOut]);

  return {
    ready,
    loading,
    latencyMs,
    sessionScore,
  };
}
