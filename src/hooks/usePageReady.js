"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function usePageReady() {
  const { user, wallet, balances, loading, walletLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  const isReady =
    isClient &&                         // ✅ Tik klientas
    !loading &&                         // ✅ Supabase auth loading turi būti pabaigęs
    !walletLoading &&                   // ✅ Wallet loading turi būti pabaigęs
    !!user?.id &&                       // ✅ Vartotojas turi būti prisijungęs
    !!wallet?.wallet?.address &&        // ✅ Turi būti wallet address
    balances !== null;                  // ✅ Balances turi būti jau gauti

  return isReady;
}
