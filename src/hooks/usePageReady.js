"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function usePageReady() {
  const { user, wallet, balances, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  const isReady =
    isClient &&
    !loading &&
    !!user?.id &&
    !!wallet?.wallet?.address &&
    balances !== null;

  return isReady;
}
