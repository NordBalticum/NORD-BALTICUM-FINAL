"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";

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

  const isClient = typeof window !== "undefined";
  const mountTime = useRef(null);
  const lastActivity = useRef(Date.now());

  // ✅ Check if component is visible in viewport
  const isVisible = () => {
    const el = document?.getElementById(componentId);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  };

  // ✅ Mark hydration ready
  useEffect(() => {
    if (!isClient) return;
    setIsHydrated(true);
    mountTime.current = Date.now();
  }, [isClient]);

  // ✅ Main readiness checker
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

  // ✅ Auto-refresh on resume/focus if component not ready yet
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

  // ✅ Offline fallback warning
  useEffect(() => {
    if (!isClient) return;
    const handleOffline = () =>
      toast.warning(`⚠️ You are offline – [${componentId}] may not load.`);
    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, [componentId]);

  return {
    componentReady,
    loading: !componentReady,
    hydrated: isHydrated,
    loadTime,
    failCount,
  };
}
