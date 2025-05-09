"use client";

/**
 * useMinimalReady — MetaMask-Grade Session Guard Hook
 * ====================================================
 * Tikrina ar sistema pasiruošusi naudoti: user, wallet, signer, DOM, mobilus statusas.
 * - Automatinis session refresh su cooldown + retry
 * - Debounce'inamas matomumas, focus, online statusas
 * - Auto refresh kas 30s jeigu praėjo 5min nuo paskutinio
 * - Detekuoja offline, mobile, resume, pageshow
 */

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
  const refreshCooldown = useRef(false);
  const refreshInterval = useRef(null);

  const { isMobile } = useMemo(() => detectIsMobile(), []);

  // ✅ DOM ready tracker
  useEffect(() => {
    if (!isClient) return;

    const markReady = () => setIsDomReady(true);

    if (document.readyState === "complete") {
      markReady();
    } else {
      const raf = requestAnimationFrame(markReady);
      const timeout = setTimeout(markReady, 1200);
      window.addEventListener("load", markReady);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timeout);
        window.removeEventListener("load", markReady);
      };
    }
  }, [isClient]);

  // ✅ Minimal readiness tikrinimas
  const minimalReady = useMemo(() => {
    return (
      isClient &&
      isDomReady &&
      !!user?.email &&
      !!wallet?.wallet?.address &&
      !authLoading &&
      !walletLoading &&
      Object.keys(wallet?.signers || {}).length > 0
    );
  }, [isClient, isDomReady, user, wallet, authLoading, walletLoading]);

  const loading = !minimalReady;

  // ✅ Sesijos kokybės balas
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

  // ✅ Aktyvus + pasyvus refresh
  useEffect(() => {
    if (!minimalReady || !safeRefreshSession) return;

    const refresh = async (trigger = "auto") => {
      if (refreshCooldown.current) return;

      refreshCooldown.current = true;
      setTimeout(() => (refreshCooldown.current = false), 2500); // Cooldown 2.5s

      const start = performance.now();
      try {
        await safeRefreshSession();
        lastRefreshTime.current = Date.now();
        setLatencyMs(Math.round(performance.now() - start));
        failureCount.current = 0;
        console.log(`✅ Session refreshed [${trigger}] (${latencyMs}ms)`);
      } catch (err) {
        failureCount.current++;
        console.error(`❌ Refresh failed [${trigger}] (${failureCount.current}/3):`, err?.message || err);
        if (failureCount.current >= 3) {
          toast.error("⚠️ Session expired. Logging out...");
          signOut?.(true);
        }
      }
    };

    const onVisible = debounce(() => {
      if (document.visibilityState === "visible") refresh("visibility");
    }, 300);
    const onFocus = debounce(() => refresh("focus"), 300);
    const onOnline = debounce(() => refresh("online"), 300);

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    if (isMobile) {
      const onWake = debounce(() => refresh("pageshow"), 300);
      window.addEventListener("pageshow", onWake);
      document.addEventListener("resume", onWake);

      return () => {
        onFocus.cancel();
        onOnline.cancel();
        onVisible.cancel();
        onWake.cancel();
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("online", onOnline);
        window.removeEventListener("pageshow", onWake);
        document.removeEventListener("resume", onWake);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }

    return () => {
      onFocus.cancel();
      onOnline.cancel();
      onVisible.cancel();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [minimalReady, safeRefreshSession, isMobile, signOut]);

  // ✅ Periodic auto refresh kas 30s jei praėjo >5min
  useEffect(() => {
    if (!minimalReady || !safeRefreshSession) return;

    refreshInterval.current = setInterval(() => {
      if (Date.now() - lastRefreshTime.current >= 5 * 60 * 1000) {
        console.log("⏳ Auto refresh after 5min");
        safeRefreshSession?.();
        lastRefreshTime.current = Date.now();
      }
    }, 30_000);

    return () => clearInterval(refreshInterval.current);
  }, [minimalReady, safeRefreshSession]);

  // ✅ Offline detection
  useEffect(() => {
    if (!isClient) return;
    const onOffline = () => toast.warning("⚠️ You are offline. Using cached data.");
    window.addEventListener("offline", onOffline);
    return () => window.removeEventListener("offline", onOffline);
  }, []);

  return {
    ready: minimalReady,     // boolean — visa sistema veikia
    loading,                 // boolean — false kai pasiruošęs
    latencyMs,               // number — paskutinio refresh greitis
    sessionScore,            // number — 0–100
    isMobile,                // boolean — ar mobile įrenginys
  };
}
