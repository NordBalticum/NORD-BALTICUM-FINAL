"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";

export function useSystemReady() {
  const [isDomReady, setIsDomReady] = useState(false);
  
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId } = useNetwork();

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

  const isMobile = useMemo(() => {
    if (typeof window !== "undefined") {
      return /Mobi|Android|iPhone/i.test(navigator.userAgent);
    }
    return false;
  }, []);

  const ready = useMemo(() => {
    return (
      isDomReady &&
      !authLoading &&
      !walletLoading &&
      !!user?.email &&
      !!wallet?.wallet?.address &&
      !!activeNetwork &&
      !!chainId
    );
  }, [
    isDomReady,
    authLoading,
    walletLoading,
    user,
    wallet,
    activeNetwork,
    chainId,
  ]);

  return {
    ready,
    loading: !ready,
    isMobile,
  };
}
