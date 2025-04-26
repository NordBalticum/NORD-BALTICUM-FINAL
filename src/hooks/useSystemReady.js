// src/hooks/useSystemReady.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";      // ← importuojam
import { useNetwork } from "@/contexts/NetworkContext";
import { startSessionWatcher } from "@/utils/sessionWatcher";
import { detectIsMobile } from "@/utils/detectIsMobile";

export function useSystemReady() {
  // 🎯 Context & hooks
  const {
    user,
    wallet,
    authLoading,
    walletLoading,
    safeRefreshSession,
    signOut,
  } = useAuth();
  const { activeNetwork, chainId } = useNetwork();
  const {
    refetch,
    loading: balancesLoading,   // ← gaunam BalanceContext loading
  } = useBalance();

  // 🎯 Internal state
  const [isDomReady, setIsDomReady] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);
  const [sessionScore, setSessionScore] = useState(100);

  // 🎯 Refs & flags
  const sessionWatcher = useRef(null);
  const lastRefreshTime = useRef(Date.now());
  const failureCount = useRef(0);
  const isClient = typeof window !== "undefined";
  const isMobile = useMemo(() => detectIsMobile(), []);

  // ─── 1) DOM ready ───────────────────────────────────────────
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

  // ─── 2) Compute minimal ready ───────────────────────────────
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
  }, [
    isClient,
    isDomReady,
    user,
    wallet,
    activeNetwork,
    chainId,
    authLoading,
    walletLoading,
  ]);

  // ─── 3) Final ready/loading flags ───────────────────────────
  //   – minimalReady: auth+wallet+DOM ok
  //   – balancesLoading: kainos/balansai kraunasi fone
  const ready = minimalReady;                  
  const loading = !ready;

  // ─── 4) Session score ───────────────────────────────────────
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

  // ─── 5) Manual refresh triggers ─────────────────────────────
  useEffect(() => {
    if (!minimalReady) return;
    const runRefresh = async (trigger) => {
      const start = performance.now();
      try {
        await safeRefreshSession();
        await refetch();
        lastRefreshTime.current = Date.now();
        setLatencyMs(Math.round(performance.now() - start));
        failureCount.current = 0;
      } catch (err) {
        failureCount.current += 1;
        if (failureCount.current >= 3) {
          toast.error("⚠️ Session expired. Logging out...");
          signOut(true);
        }
      }
    };
    const onVisible = debounce(() => runRefresh("visibility"), 300);
    const onFocus = debounce(() => runRefresh("focus"), 300);
    const onOnline = debounce(() => runRefresh("online"), 300);
    window.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    return () => {
      onVisible.cancel();
      onFocus.cancel();
      onOnline.cancel();
      window.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [minimalReady, safeRefreshSession, refetch, signOut]);

  // ─── 6) Polling & reset ─────────────────────────────────────
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

  // ─── 7) Offline detection ────────────────────────────────────
  useEffect(() => {
    if (!isClient) return;
    const notify = () => toast.warning("⚠️ You are offline. Using cached data.");
    window.addEventListener("offline", notify);
    return () => window.removeEventListener("offline", notify);
  }, [isClient]);

  // ─── 8) Background session watcher ──────────────────────────
  useEffect(() => {
    if (!minimalReady) return;
    sessionWatcher.current = startSessionWatcher({
      user,
      wallet,
      refreshSession: safeRefreshSession,
      refetchBalances: refetch,
      onSessionInvalid: () => {
        failureCount.current += 1;
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
    ready,         // spinner until this is true
    loading,
    latencyMs,
    sessionScore,
    isMobile,
  };
}
