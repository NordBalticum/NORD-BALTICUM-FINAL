// src/hooks/useSystemReady.ts
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";

export function useSystemReady() {
  // 1) Hydration / DOM ready flag
  const [isDomReady, setIsDomReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.readyState === "complete") {
      setIsDomReady(true);
    } else {
      const onLoad = () => setIsDomReady(true);
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  // 2) Pull in your contexts
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId }              = useNetwork();
  const { loading: balancesLoading }            = useBalance();

  // 3) “Minimal ready” once everything’s in place
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

  // 4) Expose
  return {
    ready,
    loading: !ready,
  };
}
