"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";

export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, loading: balancesLoading } = useBalance(); // ✅ Paimam loading iš BalanceContext

  const isClient = typeof window !== "undefined";

  // ✅ Minimalus readiness: user, wallet address, active network
  const minimalReady =
    isClient &&
    !!user?.email &&
    !!wallet?.wallet?.address &&
    !!activeNetwork;

  // ✅ Ar balansai atėjo (čia svarbu: tikrini ar loading baigtas!)
  const hasBalances = balances && Object.keys(balances).length >= 0 && !balancesLoading;

  // ✅ Viskas READY kai minimalūs reikalavimai + balansai pakrauti
  const ready = minimalReady && !authLoading && !walletLoading && hasBalances;

  // ✅ Loaderis jei kažko trūksta
  const loading = !ready;

  return { ready, loading };
}
