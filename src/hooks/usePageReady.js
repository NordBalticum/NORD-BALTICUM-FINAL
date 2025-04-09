"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePrices } from "@/hooks/usePrices";

/**
 * Ultimate safe Page Ready Hook
 * - Tikrina User + Balances + Prices
 * - Tik pirmam užkrovimui
 */
export function usePageReady() {
  const { user } = useAuth();
  const { balances, loading: balancesLoading, initialLoading } = useBalance();
  const { prices } = usePrices();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady) return;

    const balancesLoaded = balances && !initialLoading && !balancesLoading;
    const pricesLoaded = prices && Object.keys(prices).length > 0;
    const userLoaded = !!user;

    if (balancesLoaded && pricesLoaded && userLoaded) {
      console.log("✅ Page Ready!");
      setIsReady(true);
    }
  }, [user, balances, initialLoading, balancesLoading, prices, isReady]);

  return isReady;
}
