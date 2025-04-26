// src/hooks/useSystemReady.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { startSessionWatcher } from "@/utils/sessionWatcher";
import { detectIsMobile } from "@/utils/detectIsMobile";

export function useSystemReady() {
  // 🎯 Context & hooks
  const { user, wallet, authLoading, walletLoading, safeRefreshSession, signOut } = useAuth();
  const { activeNetwork, chainId } = useNetwork();
  const { balances, prices, refetch } = useBalance();

  // 🎯 Internal state
  const [isDomReady, setIsDomReady] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);
  const [sessionScore, setSessionScore] = useState(100);
  const [fallbackBalances, setFallbackBalances] = useState(null);
  const [fallbackPrices, setFallbackPrices] = useState(null);

  // 🎯 Refs & flags
  const sessionWatcher = useRef(null);
  const refreshInterval = useRef(null);
  const lastRefreshTime = useRef(Date.now());
  const failureCount = useRef(0);
  const isClient = typeof window !== "undefined";
  const isMobile = useMemo(() => detectIsMobile(), []);

  // ─── 1) DOM ready check ──────────────────────────────────────
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

  // ─── 2) Load fallback balances/prices ─────────────────────────
  useEffect(() => {
    if (!isClient) return;
    try {
      const b = localStorage.getItem("nordbalticum_balances");
      if (b) {
        setFallbackBalances(JSON.parse(b));
        console.debug("🪄 fallbackBalances loaded");
      }
      const p = localStorage.getItem("nordbalticum_prices");
      if (p) {
        setFallbackPrices(JSON.parse(p));
        console.debug("💱 fallbackPrices loaded");
      }
    } catch (err) {
      console.warn("❌ Fallback load error:", err);
    }
  }, [isClient]);

  // ─── 3) Compute minimal ready ─────────────────────────────────
  const minimalReady = useMemo(() => {
    return (
      isClient &&
      isDomReady &&
      !!user?.email &&
      !!wallet?.wallet?.address &&
      !!activeNetwork &&
      !!chainId &&
      !authLoading &&
      !walletLoading
    );
  }, [isClient, isDomReady, user, wallet, activeNetwork, chainId, authLoading, walletLoading]);

  // ─── 4) Check balances/prices availability ───────────────────
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

  // ─── 5) Session Score Calculation ────────────────────────────
  useEffect(() => {
    if (!minimalReady) return;
    const score =
      100 -
      (authLoading ? 20 : 0) -
      (walletLoading ? 20 : 0) -
      (!user ? 30 : 0) -
      (!wallet?.wallet?.address ? 30 : 0);
    setSessionScore(Math.max(0, score));
  }, [minimalReady, authLoading, walletLoading, user, wallet]);

  // ─── 6) Manual Refresh Triggers ───────────────────────────────
  useEffect(() => {
    if (!minimalReady) return;

    const runRefresh = async (trigger) => {
      const start = performance.now();
      try {
        await safeRefreshSession();
        await refetch();
        lastRefreshTime.current = Date.now();
        const dur = Math.round(performance.now() - start);
        setLatencyMs(dur);
        failureCount.current = 0;
        console.debug(`✅ Manual refresh [${trigger}] ${dur}ms`);
      } catch (err) {
        failureCount.current += 1;
        console.error(`❌ Refresh [${trigger}] failed (${failureCount.current}/3):`, err);
        if (failureCount.current >= 3) {
          toast.error("⚠️ Session expired. Logging out...");
          signOut(true);
        }
      }
    };

    const onVisible = debounce(() => runRefresh("visibility"), 300);
    const onFocus = debounce(() => runRefresh("focus"), 300);
    const onOnline = debounce(() => runRefresh("online"), 300);
    const onWake = () => setTimeout(() => runRefresh("resume"), 800);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    if (isMobile) {
      document.addEventListener("resume", onWake);
      window.addEventListener("pageshow", onWake);
    }

    return () => {
      onVisible.cancel();
      onFocus.cancel();
      onOnline.cancel();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      if (isMobile) {
        document.removeEventListener("resume", onWake);
        window.removeEventListener("pageshow", onWake);
      }
    };
  }, [minimalReady, safeRefreshSession, refetch, signOut, isMobile]);

  // ─── 7) Auto Light Polling (every 30s) and Reset (5min) ───────
  useEffect(() => {
    if (!minimalReady) return;
    const lightPoll = setInterval(async () => {
      if (Date.now() - lastRefreshTime.current >= 30_000) {
        await safeRefreshSession();
        await refetch();
        lastRefreshTime.current = Date.now();
      }
    }, 30_000);

    const heavyReset = setInterval(() => {
      failureCount.current = 0;
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(lightPoll);
      clearInterval(heavyReset);
    };
  }, [minimalReady, safeRefreshSession, refetch]);

  // ─── 8) Offline detection ────────────────────────────────────
  useEffect(() => {
    if (!isClient) return;
    const notify = () => toast.warning("⚠️ You are offline. Using cached data.");
    window.addEventListener("offline", notify);
    return () => window.removeEventListener("offline", notify);
  }, [isClient]);

  // ─── 9) Start Background Session Watcher ─────────────────────
  useEffect(() => {
    if (!minimalReady) return;

    sessionWatcher.current = startSessionWatcher({
      user,
      wallet,
      refreshSession: safeRefreshSession,
      refetchBalances: refetch,
      onSessionInvalid: () => {
        failureCount.current += 1;
        console.warn("⚠️ Session invalid detected:", failureCount.current);
        if (failureCount.current >= 3) {
          toast.error("⚠️ Persistent session error. Logging out...");
          signOut(true);
        }
      },
      log: true,
      intervalMs: 60000,
      networkFailLimit: 3,
    });

    sessionWatcher.current.start();
    return () => sessionWatcher.current?.stop();
  }, [minimalReady, user, wallet, safeRefreshSession, refetch, signOut]);

  // ─── Return final state ──────────────────────────────────────
  return {
    ready,
    loading,
    latencyMs,
    sessionScore,
    fallbackBalances,
    fallbackPrices,
    isMobile,
  };
}
