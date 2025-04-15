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

  // ✅ DOM + langas ready
  useEffect(() => {
    if (!isClient) return;

    const markReady = () => setIsDomReady(true);
    if (document.readyState === "complete") {
      markReady();
    } else {
      window.addEventListener("load", markReady);
      return () => window.removeEventListener("load", markReady);
    }
  }, [isClient]);

  // ✅ Minimal readiness – be balansų
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

  // ✅ Debounced session refresh on tab-visible or online
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    const refresh = async (trigger) => {
      const start = performance.now();
      try {
        await safeRefreshSession?.();
        lastRefreshTime.current = Date.now();
        console.log(`✅ MinimalRefresh [${trigger}] (${Math.round(performance.now() - start)}ms)`);
      } catch (err) {
        console.error(`❌ MinimalRefresh failed [${trigger}]:`, err.message);
      }
    };

    const onVisible = debounce(() => refresh("tab-visible"), 300);
    const onOnline = debounce(() => refresh("network-online"), 300);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [minimalReady, safeRefreshSession]);

  // ✅ Auto session refresh kas 5min (tikrinama kas 30s)
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

  // ✅ Final SessionWatcher start
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    sessionWatcher.current = startSessionWatcher({
      onSessionInvalid: () => {
        toast.error("⚠️ Session lost. Logging out.");
        signOut?.(true);
      },
      user,
      wallet,
      refreshSession: safeRefreshSession,
      refetchBalances: null, // nėra balansų šiame hooke
      log: true,
      intervalMs: 60000,
      networkFailLimit: 3,
    });

    sessionWatcher.current.start();

    return () => sessionWatcher.current?.stop?.();
  }, [minimalReady, user, wallet, safeRefreshSession, signOut]);

  return { ready: minimalReady, loading };
}
