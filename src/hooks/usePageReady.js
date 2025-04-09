"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePrices } from "@/hooks/usePrices";

/**
 * Ultimate safe Page Ready Hook
 * - Tik pirmai užkrovimo fazei
 * - Po to niekada nebepereina atgal į loading
 */
export function usePageReady() {
  const { user } = useAuth();
  const { balances, loading: balancesLoading, initialLoading } = useBalance();
  const { prices } = usePrices();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady) return; // ✅ Jeigu jau ready, daugiau nieko nedarom.

    const balancesLoaded = balances && !initialLoading && !balancesLoading;
    const pricesLoaded = prices && Object.keys(prices).length > 0;
    const userLoaded = !!user;

    if (balancesLoaded && pricesLoaded && userLoaded) {
      console.log("✅ Page ready!");
      setIsReady(true);
    }
  }, [user, balances, initialLoading, balancesLoading, prices, isReady]);

  return isReady;
}
