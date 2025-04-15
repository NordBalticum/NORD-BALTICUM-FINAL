// src/hooks/useComponentReady.js
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/AuthContext";
import { startSessionWatcher } from "@/utils/sessionWatcher";

export function useComponentReady(componentId = "") {
  const {
    user,
    wallet,
    authLoading,
    walletLoading,
    safeRefreshSession,
    signOut,
  } = useAuth();

  const [isHydrated, setIsHydrated] = useState(false);
  const [componentReady, setComponentReady] = useState(false);
  const [loadTime, setLoadTime] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [sessionScore, setSessionScore] = useState(100);
  const [latencyMs, setLatencyMs] = useState(0);

  const isClient = typeof window !== "undefined";
  const mountTime = useRef(null);
  const refreshInterval = useRef(null);
  const lastRefreshTime = useRef(Date.now());
  const failureCount = useRef(0);
  const sessionWatcher = useRef(null);

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

  const isVisible = () => {
    const el = document?.getElementById(componentId);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  };

  useEffect(() => {
    if (!isClient) return;
    setIsHydrated(true);
    mountTime.current = Date.now();
  }, [isClient]);

  useEffect(() => {
    if (
      !isClient ||
      !isHydrated ||
      !user?.email ||
      !wallet?.wallet?.address ||
      authLoading ||
      walletLoading
    )
      return;

    const delay = Math.random() * 500 + 250;

    const timer = setTimeout(() => {
      if (isVisible()) {
        setComponentReady(true);
        setLoadTime(Date.now() - mountTime.current);
        console.log(`✅ [${componentId}] ready in ${Date.now() - mountTime.current}ms`);
      } else {
        setFailCount((prev) => prev + 1);
        console.warn(`⏳ [${componentId}] not in viewport yet.`);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [user, wallet, authLoading, walletLoading, isHydrated, componentId]);

  useEffect(() => {
    if (!isClient || componentReady) return;

    const refreshCheck = debounce(() => {
      if (!componentReady && isVisible()) {
        setComponentReady(true);
        setLoadTime(Date.now() - mountTime.current);
        console.log(`✅ [${componentId}] became ready on retry.`);
      }
    }, 500);

    window.addEventListener("focus", refreshCheck);
    window.addEventListener("scroll", refreshCheck);
    window.addEventListener("resize", refreshCheck);
    document.addEventListener("visibilitychange", refreshCheck);

    return () => {
      window.removeEventListener("focus", refreshCheck);
      window.removeEventListener("scroll", refreshCheck);
      window.removeEventListener("resize", refreshCheck);
      document.removeEventListener("visibilitychange", refreshCheck);
    };
  }, [componentReady, componentId]);

  useEffect(() => {
    if (!isClient || !componentReady) return;

    const refresh = async (trigger) => {
      const start = performance.now();
      try {
        await safeRefreshSession?.();
        lastRefreshTime.current = Date.now();
        setLatencyMs(Math.round(performance.now() - start));
        failureCount.current = 0;
        console.log(`✅ ComponentRefresh [${componentId}] [${trigger}] (${latencyMs}ms)`);
      } catch (err) {
        failureCount.current += 1;
        console.error(`❌ ComponentRefresh failed [${componentId}] (${failureCount.current}/3):`, err?.message || err);
        if (failureCount.current >= 3) {
          toast.error(`⚠️ Session expired. Logging out...`);
          if (typeof signOut === "function") {
            signOut(true);
          }
        }
      }
    };

    const resumeHandler = () => setTimeout(() => refresh("mobile-resume"), 800);
    const onVisible = debounce(() => refresh("visibility"), 300);
    const onFocus = debounce(() => refresh("focus"), 300);
    const onOnline = debounce(() => refresh("online"), 300);

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    if (isMobile) {
      document.addEventListener("resume", resumeHandler);
      window.addEventListener("pageshow", resumeHandler);
    }

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      if (isMobile) {
        document.removeEventListener("resume", resumeHandler);
        window.removeEventListener("pageshow", resumeHandler);
      }
    };
  }, [componentReady, componentId, safeRefreshSession, signOut, isMobile]);

  useEffect(() => {
    if (!isClient || !componentReady) return;

    refreshInterval.current = setInterval(() => {
      if (Date.now() - lastRefreshTime.current >= 5 * 60 * 1000) {
        console.log(`⏳ Auto ComponentRefresh [${componentId}]`);
        safeRefreshSession?.();
        lastRefreshTime.current = Date.now();
      }
    }, 30000);

    return () => clearInterval(refreshInterval.current);
  }, [componentReady, componentId, safeRefreshSession]);

  useEffect(() => {
    if (!isClient) return;

    const handleOffline = () =>
      toast.warning(`⚠️ You are offline – [${componentId}] may not load.`);
    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, [componentId]);

  useEffect(() => {
    if (!isClient || !componentReady) return;

    sessionWatcher.current = startSessionWatcher({
      onSessionInvalid: () => {
        failureCount.current += 1;
        console.warn(`⚠️ ComponentSession [${componentId}] failure ${failureCount.current}/3`);
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
  }, [componentReady, user, wallet, safeRefreshSession, signOut, componentId]);

  useEffect(() => {
    if (!isClient || !componentReady) return;

    const score =
      100 -
      (authLoading ? 20 : 0) -
      (walletLoading ? 20 : 0) -
      (!user ? 30 : 0) -
      (!wallet?.wallet?.address ? 30 : 0);

    setSessionScore(Math.max(0, score));
  }, [componentReady, authLoading, walletLoading, user, wallet]);

  return {
    componentReady,
    loading: !componentReady,
    hydrated: isHydrated,
    loadTime,
    failCount,
    latencyMs,
    sessionScore,
    isMobile,
  };
}
