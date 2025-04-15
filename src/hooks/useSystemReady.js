"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { startSessionWatcher } from "@/utils/sessionWatcher";

export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading, safeRefreshSession, signOut } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, loading: balancesLoading, prices, refetch } = useBalance();

  const [isDomReady, setIsDomReady] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);
  const [sessionScore, setSessionScore] = useState(100);
  const [fallbackBalances, setFallbackBalances] = useState(null);
  const [fallbackPrices, setFallbackPrices] = useState(null);

  const sessionWatcher = useRef(null);
  const refreshInterval = useRef(null);
  const lastRefreshTime = useRef(Date.now());

  const isClient = typeof window !== "undefined";

  // ✅ Mobile / WebView Detection
  const isMobile = useMemo(() => {
    if (!isClient) return false;
    const ua = navigator.userAgent || navigator.vendor || "";
    return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(ua);
  }, [isClient]);

  // ✅ DOM Ready
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

  // ✅ Load fallbackBalances + fallbackPrices
  useEffect(() => {
    if (!isClient) return;

    try {
      if (!balances) {
        const stored = localStorage.getItem("cachedBalances");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setFallbackBalances(parsed);
            console.log("🪄 Loaded fallbackBalances from localStorage");
          }
        }
      }

      if (!prices) {
        const stored = localStorage.getItem("cachedPrices");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setFallbackPrices(parsed);
            console.log("💱 Loaded fallbackPrices from localStorage");
          }
        }
      }
    } catch (err) {
      console.warn("❌ LocalStorage fallback error:", err?.message || err);
    }
  }, [balances, prices, isClient]);

  // ✅ Core system readiness
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

  // ✅ Extended readiness with fallback data
  const hasBalancesReady = useMemo(() => {
    const live = balances && Object.keys(balances).length > 0;
    const cached = fallbackBalances && Object.keys(fallbackBalances).length > 0;
    return live || cached;
  }, [balances, fallbackBalances]);

  const hasPricesReady = useMemo(() => {
    const live = prices && Object.keys(prices).length > 0;
    const cached = fallbackPrices && Object.keys(fallbackPrices).length > 0;
    return live || cached;
  }, [prices, fallbackPrices]);

  const ready = minimalReady && hasBalancesReady && hasPricesReady;
  const loading = !ready;

  // ✅ Session scoring (for diagnostics / monitoring)
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

  // ✅ Smart refresh on system events
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    const refresh = async (trigger) => {
      const start = performance.now();
      try {
        await safeRefreshSession?.();
        await refetch?.();
        lastRefreshTime.current = Date.now();
        setLatencyMs(Math.round(performance.now() - start));
        console.log(`✅ System refreshed [${trigger}] (${latencyMs}ms)`);
      } catch (err) {
        console.error(`❌ Refresh failed [${trigger}]:`, err?.message || err);
      }
    };

    const onVisible = debounce(() => refresh("visibility"), 300);
    const onFocus = debounce(() => refresh("focus"), 300);
    const onOnline = debounce(() => refresh("online"), 300);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    if (isMobile) {
      const onWake = () => setTimeout(() => refresh("mobile-resume"), 800);
      document.addEventListener("resume", onWake);
      window.addEventListener("pageshow", onWake);

      return () => {
        window.removeEventListener("pageshow", onWake);
        document.removeEventListener("resume", onWake);
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

  // ✅ Auto refresh every 5min
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

  // ✅ Offline notification
  useEffect(() => {
    if (!isClient) return;
    const notifyOffline = () => toast.warning("⚠️ You are offline. Using cached data.");
    window.addEventListener("offline", notifyOffline);
    return () => window.removeEventListener("offline", notifyOffline);
  }, []);

  // ✅ Session watcher (auto-logout on invalid session)
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    sessionWatcher.current = startSessionWatcher({
      onSessionInvalid: () => {
        toast.error("⚠️ Session expired or invalid. Logging out...");
        if (typeof signOut === "function") {
          signOut(true);
        } else {
          console.warn("⚠️ signOut handler missing.");
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
    fallbackBalances,
    fallbackPrices,
  };
}
