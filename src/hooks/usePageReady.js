"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsBalancesReady } from "@/hooks/useBalance"; // ✅ Naudojam čia
import { usePrices } from "@/hooks/usePrices";

/**
 * Ultimate safe Page Ready Hook
 * - Tik pirmai užkrovimo fazei
 * - Po to niekada nebepereina atgal į loading
 */
export function usePageReady() {
  const { user } = useAuth();
  const balancesReady = useIsBalancesReady(); // ✅ Naudojam naują hook'ą
  const { prices } = usePrices();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady) return; // ✅ Jei jau ready, daugiau nieko nedarom.

    const pricesLoaded = prices && Object.keys(prices).length > 0;
    const userLoaded = !!user;

    if (balancesReady && pricesLoaded && userLoaded) {
      console.log("✅ Page ready!");
      setIsReady(true);
    }
  }, [user, balancesReady, prices, isReady]);

  return isReady;
}
