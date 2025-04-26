"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";
import { detectIsMobile } from "@/utils/detectIsMobile";

export function useSystemReady() {
  const [isDomReady, setIsDomReady] = useState(false);

  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId } = useNetwork();
  const { loading: balancesLoading } = useBalance();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (document.readyState === "complete") {
        setIsDomReady(true);
      } else {
        const onLoad = () => setIsDomReady(true);
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
      }
    }
  }, []);

  const ready = useMemo(() => {
    return (
      isDomReady &&
      !authLoading &&
      !walletLoading &&
      !balancesLoading &&
      user?.email &&
      wallet?.wallet?.address &&
      activeNetwork &&
      chainId
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

  const isMobile = useMemo(() => detectIsMobile(), []);

  return {
    ready,
    loading: !ready,
    isMobile,
  };
}
