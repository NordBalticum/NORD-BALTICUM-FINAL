"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { startSessionWatcher } from "@/utils/sessionWatcher";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";

export function useMinimalReady() {
  const { user, wallet, authLoading, walletLoading, safeRefreshSession, signOut } = useAuth();

  const [isDomReady, setIsDomReady] = useState(false);
  const sessionWatcher = useRef(null);
  const refreshInterval = useRef(null);
  const lastRefreshTime = useRef(Date.now());

  const isClient = typeof window !== "undefined";

  // ✅ Kai DOM pilnai užsikrovęs
  useEffect(() => {
    if (!isClient) return;

    const markDomReady = () => setIsDomReady(true);

    if (document.readyState === "complete") {
      markDomReady();
    } else {
      window.addEventListener("load", markDomReady);
      return () => window.removeEventListener("load", markDomReady);
    }
  }, [isClient]);

  // ✅ Minimal readiness
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

  // ✅ Debounced refresh handlers
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    const refresh = async (trigger) => {
      const start = performance.now();
      try {
        await safeRefreshSession?.();
        lastRefreshTime.current = Date.now();
        console.log(`✅ Session refreshed [${trigger}] (${Math.round(performance.now() - start)}ms)`);
      } catch (error) {
        console.error(`❌ Refresh error [${trigger}]:`, error.message);
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
  }, [minimalReady, safeRefreshSession]);

  // ✅ Auto refresh kas 5 min (check every 30s)
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    refreshInterval.current = setInterval(() => {
      if (Date.now() - lastRefreshTime.current >= 5 * 60 * 1000) {
        console.log("⏳ Auto session refresh (Minimal Ready)");
        safeRefreshSession?.();
        lastRefreshTime.current = Date.now();
      }
    }, 30000);

    return () => clearInterval(refreshInterval.current);
  }, [minimalReady, safeRefreshSession]);

  // ✅ NEW SessionWatcher
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    sessionWatcher.current = startSessionWatcher({
      onSessionInvalid: () => {
        toast.error("⚠️ Session expired or lost. Logging out.");
        signOut?.(true);
      },
      intervalMinutes: 1,
    });

    sessionWatcher.current.start();

    return () => sessionWatcher.current?.stop?.();
  }, [minimalReady, signOut]);

  return { ready: minimalReady, loading };
}
