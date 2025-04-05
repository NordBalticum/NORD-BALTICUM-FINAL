"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export function usePageReady() {
  const { authLoading, walletLoading, user, wallet, balances } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  const isReady =
    isClient &&
    !authLoading &&
    !walletLoading &&
    !!user?.id &&
    !!wallet?.wallet?.address &&
    balances !== null;

  return isReady;
}
