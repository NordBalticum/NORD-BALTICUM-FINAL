"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";

// ✅ Minimal readiness hook
export function useMinimalReady() {
  const { user, wallet, authLoading, walletLoading, safeRefreshSession } = useAuth();

  const [isClientReady, setIsClientReady] = useState(false);

  const isClient = typeof window !== "undefined";

  // ✅ Kai DOM pilnai pasikrovęs
  useEffect(() => {
    if (!isClient) return;

    const handleLoad = () => {
      setIsClientReady(true);
    };

    if (document.readyState === "complete") {
      setIsClientReady(true);
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, [isClient]);

  // ✅ Ar turim user + wallet
  const hasUserAndWallet = Boolean(user?.email && wallet?.wallet?.address);

  // ✅ Minimal readiness
  const minimalReady =
    isClient &&
    isClientReady &&
    hasUserAndWallet &&
    !authLoading &&
    !walletLoading;

  // ✅ Loading būklė
  const loading = !minimalReady;

  // ✅ Visibility + Online Events (be debounce, tiesiogiai)
  const handlers = useMemo(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && safeRefreshSession) {
        console.log("✅ Tab became visible – refreshing session...");
        try {
          await safeRefreshSession();
        } catch (error) {
          console.error("❌ Visibility session refresh error:", error.message);
        }
      }
    };

    const handleOnline = async () => {
      if (safeRefreshSession) {
        console.log("✅ Network online – refreshing session...");
        try {
          await safeRefreshSession();
        } catch (error) {
          console.error("❌ Online session refresh error:", error.message);
        }
      }
    };

    return { handleVisibilityChange, handleOnline };
  }, [safeRefreshSession]);

  // ✅ Pagrindinė event'ų kontrolė
  useEffect(() => {
    if (!isClient) return;

    document.addEventListener("visibilitychange", handlers.handleVisibilityChange);
    window.addEventListener("online", handlers.handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handlers.handleVisibilityChange);
      window.removeEventListener("online", handlers.handleOnline);
    };
  }, [handlers, isClient]);

  // ✅ Auto safeRefresh kas 5 minutes net minimal ready būsenoje
  useEffect(() => {
    if (!isClient || !safeRefreshSession) return;

    const interval = setInterval(() => {
      console.log("⏳ Auto refreshing session (Minimal Ready)...");
      safeRefreshSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [safeRefreshSession, isClient]);

  return { ready: minimalReady, loading };
}
