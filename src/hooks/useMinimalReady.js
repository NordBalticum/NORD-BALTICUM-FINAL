// src/hooks/useMinimalReady.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/AuthContext";
import { startSessionWatcher } from "@/utils/sessionWatcher";

export function useMinimalReady() {
  const {
    user,
    wallet,
    authLoading,
    walletLoading,
    safeRefreshSession,
    signOut,
  } = useAuth();

  const [isDomReady, setIsDomReady] = useState(false);
  const [latencyMs, setLatencyMs] = useState(0);
  const [sessionScore, setSessionScore] = useState(100);

  const isClient = typeof window !== "undefined";
  const sessionWatcher = useRef(null);
  const refreshInterval = useRef(null);
  const lastRefreshTime = useRef(Date.now());
  const failureCount = useRef(0);

  const isMobile = useMemo(() => {
  if (!isClient) return false;

  const ua = navigator.userAgent.toLowerCase();
  const isTouch =
    navigator.maxTouchPoints > 1 ||
    "ontouchstart" in window ||
    window.matchMedia("(pointer: coarse)").matches;

  const isMobileUA = /android|iphone|ipod|iemobile|blackberry|bada|webos|opera mini|mobile|palm|windows phone|nexus|pixel|sm-|samsung/.test(
    ua
  );

  const isTabletUA = /ipad|tablet/.test(ua);

  const isDesktopUA = /macintosh|windows nt|linux x86_64/.test(ua);

  return isTouch && (isMobileUA || (!isDesktopUA && !isTabletUA));
}, [isClient]);

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

  const minimalReady = useMemo(
    () =>
      isClient &&
      isDomReady &&
      !!user?.email &&
      !!wallet?.wallet?.address &&
      !authLoading &&
      !walletLoading,
    [isClient, isDomReady, user, wallet, authLoading, walletLoading]
  );

  const loading = !minimalReady;

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

  useEffect(() => {
    if (!isClient || !minimalReady) return;

    const refresh = async (trigger) => {
      const start = performance.now();
      try {
        await safeRefreshSession?.();
        lastRefreshTime.current = Date.now();
        setLatencyMs(Math.round(performance.now() - start));
        failureCount.current = 0;
        console.log(`✅ MinimalRefresh [${trigger}] (${latencyMs}ms)`);
      } catch (err) {
        failureCount.current += 1;
        console.error(`❌ MinimalRefresh failed [${trigger}] (${failureCount.current}/3):`, err?.message || err);
        if (failureCount.current >= 3) {
          toast.error("⚠️ Session expired. Logging out...");
          if (typeof signOut === "function") {
            signOut(true);
          }
        }
      }
    };

    const onVisible = debounce(() => refresh("visibility"), 300);
    const onFocus = debounce(() => refresh("focus"), 300);
    const onOnline = debounce(() => refresh("network-online"), 300);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    if (isMobile) {
      const onWake = () => setTimeout(() => refresh("mobile-resume"), 800);
      document.addEventListener("resume", onWake);
      window.addEventListener("pageshow", onWake);

      return () => {
        document.removeEventListener("resume", onWake);
        window.removeEventListener("pageshow", onWake);
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
  }, [minimalReady, safeRefreshSession, isMobile, signOut]);

  useEffect(() => {
    if (!isClient || !minimalReady) return;

    refreshInterval.current = setInterval(() => {
      if (Date.now() - lastRefreshTime.current >= 5 * 60 * 1000) {
        console.log("⏳ Auto MinimalRefresh (5min)");
        safeRefreshSession?.();
        lastRefreshTime.current = Date.now();
      }
    }, 30000);

    return () => clearInterval(refreshInterval.current);
  }, [minimalReady, safeRefreshSession]);

  useEffect(() => {
    if (!isClient) return;

    const notifyOffline = () => toast.warning("⚠️ You are offline. Using cached session.");
    window.addEventListener("offline", notifyOffline);
    return () => window.removeEventListener("offline", notifyOffline);
  }, []);

  useEffect(() => {
    if (!isClient || !minimalReady) return;

    sessionWatcher.current = startSessionWatcher({
      onSessionInvalid: () => {
        failureCount.current += 1;
        console.warn("⚠️ Session may be invalid. Failure count:", failureCount.current);

        if (failureCount.current >= 3) {
          toast.error("⚠️ Session invalid. Logging out...");
          if (typeof signOut === "function") {
            signOut(true);
          }
        }
      },
      user,
      wallet,
      refreshSession: safeRefreshSession,
      refetchBalances: null,
      log: true,
      intervalMs: 60000,
      networkFailLimit: 3,
    });

    sessionWatcher.current.start();
    return () => sessionWatcher.current?.stop?.();
  }, [minimalReady, user, wallet, safeRefreshSession, signOut]);

  return {
    ready: minimalReady,
    loading,
    latencyMs,
    sessionScore,
    isMobile,
  };
}
