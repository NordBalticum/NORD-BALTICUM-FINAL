"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePrices } from "@/hooks/usePrices";

export function usePageReady() {
  const { user } = useAuth();
  const { balances, initialLoading } = useBalance();
  const { prices } = usePrices();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return; // ✅ Jei jau ready, daugiau neliesti

    const balancesLoaded = balances && Object.keys(balances).length > 0;
    const pricesLoaded = prices && Object.keys(prices).length > 0;
    const userLoaded = !!user;

    if (!initialLoading && balancesLoaded && pricesLoaded && userLoaded) {
      console.log("✅ Page ready.");
      setReady(true); // ✅ Once ready, forever ready
    }
  }, [balances, initialLoading, prices, user, ready]);

  return ready;
}
