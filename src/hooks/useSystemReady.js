"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";
import { startSessionWatcher } from "@/utils/sessionWatcher";
import { useEffect, useMemo, useRef } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

// ✅ Sistema Ready Hook
export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading, safeRefreshSession, signOut } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, loading: balancesLoading, refetch } = useBalance();

  const isClient = typeof window !== "undefined";
  const isClientReady = typeof document !== "undefined" && document.readyState === "complete";

  const sessionWatcher = useRef(null);

  // ✅ Minimalus readiness: user + wallet + network + authOK
  const minimalReady =
    isClient &&
    isClientReady &&
    !!user?.email &&
    !!wallet?.wallet?.address &&
    !!activeNetwork &&
    !authLoading &&
    !walletLoading;

  // ✅ Balansų readiness: balances + loading check
  const hasBalancesReady =
    !balancesLoading &&
    balances &&
    Object.keys(balances).length >= 0; // ✅ Leisti ir 0 balansų situaciją (pvz user empty wallet)

  // ✅ Pilnas READY
  const ready = minimalReady && hasBalancesReady;
  const loading = !ready;

  // ✅ Debounced funkcijos
  const handlers = useMemo(() => {
    const handleVisibilityChange = debounce(async () => {
      if (document.visibilityState === "visible" && minimalReady && safeRefreshSession && refetch) {
        console.log("✅ Tab visible – refreshing session and balances...");
        try {
          await safeRefreshSession();
          await refetch();
        } catch (error) {
          console.error("❌ Visibility refresh error:", error.message);
        }
      }
    }, 500);

    const handleOnline = debounce(async () => {
      if (minimalReady && safeRefreshSession && refetch) {
        console.log("✅ Network online – refreshing session and balances...");
        try {
          await safeRefreshSession();
          await refetch();
        } catch (error) {
          console.error("❌ Online refresh error:", error.message);
        }
      }
    }, 500);

    return { handleVisibilityChange, handleOnline };
  }, [safeRefreshSession, refetch, minimalReady]);

  // ✅ VisibilityChange + Online atvejų apsauga
  useEffect(() => {
    if (!isClient) return;

    document.addEventListener("visibilitychange", handlers.handleVisibilityChange);
    window.addEventListener("online", handlers.handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handlers.handleVisibilityChange);
      window.removeEventListener("online", handlers.handleOnline);
    };
  }, [handlers, isClient]);

  // ✅ Auto safeRefresh kas 5 minutes
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    const interval = setInterval(() => {
      if (safeRefreshSession) {
        console.log("⏳ Auto refreshing session...");
        safeRefreshSession();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [safeRefreshSession, minimalReady, isClient]);

  // ✅ Start SessionWatcher su network kritimo aptikimu
  useEffect(() => {
    if (!isClient || !minimalReady) return;

    sessionWatcher.current = startSessionWatcher({
      onSessionInvalid: () => {
        toast.error("⚠️ Session invalid or network down – logging out.");
        signOut(true);
      },
      intervalMs: 60000, // kas 1 min
      networkFailLimit: 3, // jei 3x iš eilės error – logout
    });

    sessionWatcher.current.start();

    return () => {
      sessionWatcher.current?.stop?.();
    };
  }, [isClient, minimalReady, signOut]);

  return { ready, loading };
}
