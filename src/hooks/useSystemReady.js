"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";

export function useSystemReady() {
  const [domReady, setDomReady] = useState(false);

  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork, chainId } = useNetwork();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (document.readyState === "complete") {
        setDomReady(true);
      } else {
        const onLoad = () => setDomReady(true);
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
      }
    }
  }, []);

  const isMobile = useMemo(() => {
    if (typeof window !== "undefined") {
      return /Mobi|Android|iPhone/i.test(navigator.userAgent);
    }
    return false;
  }, []);

  const basicReady = useMemo(() => {
    return (
      domReady &&
      !authLoading &&
      !walletLoading &&
      !!user?.email &&
      !!wallet?.wallet?.address
    );
  }, [domReady, authLoading, walletLoading, user, wallet]);

  const fullReady = useMemo(() => {
    return (
      basicReady &&
      !!activeNetwork &&
      !!chainId
    );
  }, [basicReady, activeNetwork, chainId]);

  return {
    ready: fullReady,
    loading: !fullReady,
    isMobile,
  };
}
