"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/AuthContext";
import { detectIsMobile } from "@/utils/detectIsMobile";

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
  const lastRefreshTime = useRef(Date.now());
  const failureCount = useRef(0);
  const refreshInterval = useRef(null);
  const isMobile = useMemo(() => detectIsMobile(), []);

  // Detect DOM ready
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

  const minimalReady = useMemo(() => {
    return (
      isClient &&
      isDomReady &&
      !!user?.email &&
      !!wallet?.wallet?.address &&
      !authLoading &&
      !walletLoading
    );
  }, [isClient, isDomReady, user, wallet, authLoading, walletLoading]);

  const loading = !minimalReady;

  // Update session score
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

  // Safe refresh session manually
  useEffect(() => {
    if (!minimalReady) return;

    const refresh = async (trigger) => {
      const start = performance.now();
      try {
        await safeRefreshSession?.();
        lastRefreshTime.current = Date.now();
        setLatencyMs(Math.round(performance.now() - start));
        failureCount.current = 0;
        console.log(`✅ Refreshed [${trigger}] (${latencyMs}ms)`);
      } catch (err) {
        failureCount.current += 1;
        console.error(`❌ Refresh failed [${trigger}] (${failureCount.current}/3):`, err?.message || err);
        if (failureCount.current >= 3) {
          toast.error("⚠️ Session expired. Logging out...");
          if (typeof signOut === "function") {
            signOut(true);
          }
        }
      }
    };

    const onVisible = debounce(() => refresh("visibility"), 300);
    const onFocus   = debounce(() => refresh("focus"), 300);
    const onOnline  = debounce(() => refresh("online"), 300);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    if (isMobile) {
      const onWake = debounce(() => refresh("pageshow"), 300);
      window.addEventListener("pageshow", onWake);
      document.addEventListener("resume", onWake);
      return () => {
        onVisible.cancel();
        onFocus.cancel();
        onOnline.cancel();
        onWake.cancel();
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("online", onOnline);
        window.removeEventListener("pageshow", onWake);
        document.removeEventListener("resume", onWake);
      };
    }

    return () => {
      onVisible.cancel();
      onFocus.cancel();
      onOnline.cancel();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [minimalReady, safeRefreshSession, isMobile, signOut]);

  // Polling every 30s
  useEffect(() => {
    if (!minimalReady) return;
    refreshInterval.current = setInterval(() => {
      if (Date.now() - lastRefreshTime.current >= 5 * 60 * 1000) {
        console.log("⏳ Auto refresh after 5 min");
        safeRefreshSession?.();
        lastRefreshTime.current = Date.now();
      }
    }, 30_000);
    return () => clearInterval(refreshInterval.current);
  }, [minimalReady, safeRefreshSession]);

  // Offline detection
  useEffect(() => {
    if (!isClient) return;
    const onOffline = () => toast.warning("⚠️ You are offline. Cached data in use.");
    window.addEventListener("offline", onOffline);
    return () => window.removeEventListener("offline", onOffline);
  }, []);

  return {
    ready: minimalReady,
    loading,
    latencyMs,
    sessionScore,
    isMobile,
  };
}
