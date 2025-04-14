"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";

export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, loading: balancesLoading } = useBalance();

  const isClient = typeof window !== "undefined";

  // ✅ Minimalus readiness: user, wallet address, active network
  const minimalReady =
    isClient &&
    !!user?.email &&
    !!wallet?.wallet?.address &&
    !!activeNetwork;

  // ✅ Balansų readiness: turi būti bent 1 balansas ir loading turi būti pasibaigęs
  const hasBalances =
    balances &&
    Object.keys(balances).length > 0 && // >>> TIKRINAM > 0
    !balancesLoading;

  // ✅ Viskas READY kai minimalūs reikalavimai + balansai pakrauti
  const ready =
    minimalReady &&
    !authLoading &&
    !walletLoading &&
    hasBalances;

  // ✅ Loaderis jei kažko trūksta
  const loading = !ready;

  return { ready, loading };
}
