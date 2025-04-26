"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import debounce from "lodash.debounce";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { detectIsMobile } from "@/utils/detectIsMobile";
import { useSessionManager } from "@/hooks/useSessionManager"; // ✅ tvarkingas SessionManager

export function useSystemReady() {
  // 1) DOM hydration detection
  const [isDomReady, setIsDomReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.readyState === "complete") {
      setIsDomReady(true);
    } else {
      const markReady = () => setIsDomReady(true);
      const debounceMarkReady = debounce(markReady, 100); // soft debounced
      window.addEventListener("load", debounceMarkReady);
      return () => {
        window.removeEventListener("load", debounceMarkReady);
        debounceMarkReady.cancel();
      };
    }
  }, []);

  // 2) Grab from contexts
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId } = useNetwork();
  const { loading: balancesLoading } = useBalance();

  // 3) Run session manager to auto-refresh session etc
  useSessionManager(); // 🔥 automatiškai aktyvuojam

  // 4) Minimal system readiness
  const ready = useMemo(() => {
    return (
      isDomReady &&
      !authLoading &&
      !walletLoading &&
      !balancesLoading &&
      !!user?.email &&
      !!wallet?.wallet?.address &&
      !!activeNetwork &&
      !!chainId
    );
  }, [
    isDomReady,
    authLoading,
    walletLoading,
    balancesLoading,
    user,
    wallet,
    activeNetwork,
    chainId,
  ]);

  // 5) Compute loading
  const loading = !ready;

  // 6) Mobile / Desktop detection
  const isMobile = useMemo(() => {
    if (typeof window !== "undefined") {
      return detectIsMobile();
    }
    return false;
  }, []);

  // 7) Session quality score (nice UX add-on)
  const sessionScore = useMemo(() => {
    let score = 100;
    if (authLoading) score -= 20;
    if (walletLoading) score -= 20;
    if (!user?.email) score -= 30;
    if (!wallet?.wallet?.address) score -= 30;
    if (!activeNetwork || !chainId) score -= 10;
    return Math.max(0, score);
  }, [
    authLoading,
    walletLoading,
    user,
    wallet,
    activeNetwork,
    chainId,
  ]);

  // 8) Optional: latency placeholder (future)
  const latencyMs = useRef(0);

  // 9) Final return
  return {
    ready,
    loading,
    isMobile,
    sessionScore,
    latencyMs: latencyMs.current, // future expandability
  };
}
