"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePrices } from "@/hooks/usePrices";
import { useTotalFeeCalculator } from "@/hooks/useTotalFeeCalculator";

/**
 * ULTIMATE PAGE READY HOOK
 * - Užtikrina, kad visi duomenys pilnai užkrauti prieš rodyti puslapį
 */
export function usePageReady(network, amount, gasOption) {
  const { user } = useAuth();
  const { balances, loading: balancesLoading, initialLoading } = useBalance();
  const { prices } = usePrices();
  const { loading: feeLoading } = useTotalFeeCalculator(network, amount, gasOption);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady) return;

    const balancesLoaded = balances && !initialLoading && !balancesLoading;
    const pricesLoaded = prices && Object.keys(prices).length > 0;
    const userLoaded = !!user;
    const feesLoaded = !feeLoading;

    if (balancesLoaded && pricesLoaded && userLoaded && feesLoaded) {
      console.log("✅ Page is fully ready!");
      setIsReady(true);
    }
  }, [user, balances, initialLoading, balancesLoading, prices, feeLoading, isReady]);

  return isReady;
}
