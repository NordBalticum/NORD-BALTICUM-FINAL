"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePrices } from "@/hooks/usePrices";

export function usePageReady() {
  const { user } = useAuth();
  const { balances, loading: balancesLoading, initialLoading } = useBalance();
  const { prices } = usePrices();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady) return; // ❗️ Jei jau ready, daugiau netikrinam

    const balancesLoaded = balances && !initialLoading && !balancesLoading;
    const pricesLoaded = prices && Object.keys(prices).length > 0;
    const userLoaded = !!user;

    if (balancesLoaded && pricesLoaded && userLoaded) {
      setIsReady(true);
    }
  }, [user, balances, balancesLoading, initialLoading, prices, isReady]);

  return isReady;
}
