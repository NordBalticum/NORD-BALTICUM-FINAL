"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";
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
  const sessionWatcher = useRef(null);
  const refreshInterval = useRef(null);
  const lastRefreshTime = useRef(Date.now());

  const isClient = typeof window !== "undefined";

  // ✅ Mobile / PWA / WebView detektorius
  const isMobile = useMemo(() => {
    if (!isClient) return false;
    const ua = navigator.userAgent || navigator.vendor || "";
    return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(ua);
  }, [isClient]);

  // ✅ DOM + Window Ready
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

  const minimalReady = useMemo(() =>
    isClient &&
    isDomReady &&
    !!user?.email &&
    !!wallet?.wallet?.address &&
    !authLoading &&
    !walletLoading,
    [isClient, isDomReady, user, wallet, authLoading, walletLoading]
  );

  const loading = !minimalReady;

  // ✅ Debounced session refresh on visibility, focus, network online
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    const refresh = async (trigger) => {
      const start = performance.now();
      try {
        await safeRefreshSession?.();
        lastRefreshTime.current = Date.now();
        console.log(`✅ MinimalRefresh [${trigger}] (${Math.round(performance.now() - start)}ms)`);
      } catch (err) {
        console.error(`❌ MinimalRefresh failed [${trigger}]:`, err?.message || err);
      }
    };

    const onVisible = debounce(() => refresh("visibility"), 300);
    const onFocus = debounce(() => refresh("focus"), 300);
    const onOnline = debounce(() => refresh("network-online"), 300);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    // ✅ Specialiai mobiliems – extra resume timeout (PWA fix)
    if (isMobile) {
      const resumeTimeout = () => setTimeout(() => refresh("mobile-resume"), 800);
      document.addEventListener("resume", resumeTimeout);
      window.addEventListener("pageshow", resumeTimeout);
      console.log("📱 Mobile device detected:", navigator.userAgent);
      return () => {
        document.removeEventListener("resume", resumeTimeout);
        window.removeEventListener("pageshow", resumeTimeout);
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
  }, [minimalReady, safeRefreshSession, isMobile]);

  // ✅ Auto session refresh kas 5min
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
        toast.error("⚠️ Session lost. Logging out.");
        if (typeof signOut === "function") {
          signOut(true);
        } else {
          console.warn("⚠️ signOut is not available.");
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

  return { ready: minimalReady, loading };
}
