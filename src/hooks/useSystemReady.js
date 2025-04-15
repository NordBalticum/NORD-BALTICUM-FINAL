"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";
import { startSessionWatcher } from "@/utils/sessionWatcher";

export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading, safeRefreshSession, signOut } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, loading: balancesLoading, refetch } = useBalance();

  const [isDomReady, setIsDomReady] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);
  const [sessionScore, setSessionScore] = useState(100);

  const sessionWatcher = useRef(null);
  const refreshInterval = useRef(null);
  const lastRefreshTime = useRef(Date.now());

  const isClient = typeof window !== "undefined";

  // ✅ Detect mobile / PWA / WebView environment
  const isMobile = useMemo(() => {
    if (!isClient) return false;
    const ua = navigator.userAgent || navigator.vendor || "";
    return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(ua);
  }, [isClient]);

  // ✅ DOM ready
  useEffect(() => {
    if (!isClient) return;

    const markReady = () => setIsDomReady(true);

    if (document.readyState === "complete") {
      markReady();
    } else {
      const raf = requestAnimationFrame(markReady);
      const timeout = setTimeout(markReady, 1000);
      window.addEventListener("load", markReady);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timeout);
        window.removeEventListener("load", markReady);
      };
    }
  }, [isClient]);

  // ✅ Core readiness
  const minimalReady = useMemo(() =>
    isClient &&
    isDomReady &&
    !!user?.email &&
    !!wallet?.wallet?.address &&
    !!activeNetwork &&
    !authLoading &&
    !walletLoading,
    [isClient, isDomReady, user, wallet, activeNetwork, authLoading, walletLoading]
  );

  // ✅ Extended: balances
  const hasBalancesReady = useMemo(() =>
    !balancesLoading && balances && Object.keys(balances || {}).length >= 0,
    [balances, balancesLoading]
  );

  const ready = minimalReady && hasBalancesReady;
  const loading = !ready;

  // ✅ Session scoring (diagnostics)
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

  // ✅ Smart refresh on visibility/focus/network events
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    const refresh = async (trigger) => {
      const start = performance.now();
      try {
        await safeRefreshSession?.();
        await refetch?.();
        lastRefreshTime.current = Date.now();
        setLatencyMs(Math.round(performance.now() - start));
        console.log(`✅ Full refresh [${trigger}] (${latencyMs}ms)`);
      } catch (err) {
        console.error(`❌ Refresh failed [${trigger}]:`, err?.message || err);
      }
    };

    const onVisible = debounce(() => refresh("visibility"), 300);
    const onFocus = debounce(() => refresh("focus"), 300);
    const onOnline = debounce(() => refresh("network-online"), 300);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    // ✅ Extra mobile resume fix (for Android/iOS sleep)
    if (isMobile) {
      const resumeTimeout = () => setTimeout(() => refresh("mobile-resume"), 800);
      window.addEventListener("pageshow", resumeTimeout);
      document.addEventListener("resume", resumeTimeout);
      console.log("📱 Mobile device detected:", navigator.userAgent);

      return () => {
        window.removeEventListener("pageshow", resumeTimeout);
        document.removeEventListener("resume", resumeTimeout);
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("online", onOnline);
      };
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [minimalReady, safeRefreshSession, refetch, isMobile]);

  // ✅ Auto refresh every 5 minutes
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    refreshInterval.current = setInterval(() => {
      if (Date.now() - lastRefreshTime.current >= 5 * 60 * 1000) {
        console.log("⏳ Auto refresh (5min)");
        safeRefreshSession?.();
        refetch?.();
        lastRefreshTime.current = Date.now();
      }
    }, 30000);

    return () => clearInterval(refreshInterval.current);
  }, [minimalReady, safeRefreshSession, refetch]);

  // ✅ Offline warning
  useEffect(() => {
    if (!isClient) return;
    const notifyOffline = () => toast.warning("⚠️ You are offline. Some features may not work.");
    window.addEventListener("offline", notifyOffline);
    return () => window.removeEventListener("offline", notifyOffline);
  }, []);

  // ✅ Session Watcher
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    sessionWatcher.current = startSessionWatcher({
      onSessionInvalid: () => {
        toast.error("⚠️ Session invalid or expired. Logging out.");
        if (typeof signOut === "function") {
          signOut(true);
        } else {
          console.warn("⚠️ signOut is not available.");
        }
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

    return () => sessionWatcher.current?.stop?.();
  }, [minimalReady, user, wallet, safeRefreshSession, refetch, signOut]);

  return {
    ready,
    loading,
    latencyMs,
    sessionScore,
  };
}
