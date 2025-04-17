"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { startSessionWatcher } from "@/utils/sessionWatcher";
import { detectIsMobile } from "@/utils/detectIsMobile";
import { useScale } from "@/hooks/useScale";

// Centralized context for system readiness, device-specific logic, scaling, and session management
const SystemReadyContext = createContext(null);

export function SystemReadyProvider({ children }) {
  const state = useSystemReady();
  return (
    <SystemReadyContext.Provider value={state}>
      {children}
    </SystemReadyContext.Provider>
  );
}

export function useSystemReady() {
  const ctx = useContext(SystemReadyContext);
  if (!ctx) {
    throw new Error("useSystemReady must be used within <SystemReadyProvider>");
  }
  return ctx;
}

/**
 * Custom hook to manage system readiness, scaling, and device-specific logic
 */
export function useSystemReady() {
  // 🎯 Context & hooks
  const { user, wallet, authLoading, walletLoading, safeRefreshSession, signOut } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, prices, refetch } = useBalance();

  // 🎯 Internal state for system readiness
  const [isDomReady, setIsDomReady] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);
  const [sessionScore, setSessionScore] = useState(100);
  const [fallbackBalances, setFallbackBalances] = useState(null);
  const [fallbackPrices, setFallbackPrices] = useState(null);
  const [isMobile, setIsMobile] = useState(false); // Mobile check based on device screen
  const [scale, setScale] = useState(1); // Scaling factor

  // 🎯 Refs for tracking state and session
  const sessionWatcher = useRef(null);
  const lastRefreshTime = useRef(Date.now());
  const failureCount = useRef(0);

  // 🏁 Mobile check (detect device type)
  useEffect(() => {
    setIsMobile(detectIsMobile()); // Automatically sets the device type (mobile, tablet, desktop)
  }, []);

  // 🏁 Scaling with `useScale` (custom scaling logic)
  const baseScale = 1.0;
  const scaleConfig = useScale(baseScale); // Dynamically set scaling factor

  // 🎯 Client-side checks and updates
  const isClient = typeof window !== "undefined";

  useEffect(() => {
    if (!isClient) return;
    const markReady = () => setIsDomReady(true); // Mark DOM as ready when fully loaded

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

  // 🏁 Ready check (minimal)
  const minimalReady = useMemo(() => {
    return isClient && isDomReady && !!user?.email && !!wallet?.wallet?.address && !!activeNetwork && !authLoading && !walletLoading;
  }, [isClient, isDomReady, user, wallet, activeNetwork, authLoading, walletLoading]);

  // 🏁 Full readiness check (with balances and prices)
  const fullReady = useMemo(() => {
    const hasBalances = balances && Object.keys(balances).length > 0;
    const hasPrices = prices && Object.keys(prices).length > 0;
    return minimalReady && hasBalances && hasPrices;
  }, [minimalReady, balances, prices]);

  // 🏁 Balances and prices readiness
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

  // 🏁 Session health scoring
  useEffect(() => {
    if (!minimalReady) return;
    const score = 100 - (authLoading ? 20 : 0) - (walletLoading ? 20 : 0) - (!user ? 30 : 0) - (!wallet?.wallet?.address ? 30 : 0);
    setSessionScore(Math.max(0, score));
  }, [minimalReady, authLoading, walletLoading, user, wallet]);

  // 🏁 Session monitoring with `startSessionWatcher`
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

  // 🏁 Refresh handling (visibility change, focus, etc.)
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

  // 🏁 Return system readiness states
  return {
    ready: fullReady,
    loading: !fullReady,
    latencyMs,
    sessionScore,
    fallbackBalances,
    fallbackPrices,
    isMobile,
    scale,
  };
}
