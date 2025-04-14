"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";

// ✅ Sistema Ready Hook
export function useSystemReady() {
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { activeNetwork } = useNetwork();
  const { balances, loading: balancesLoading } = useBalance();

  const isClient = typeof window !== "undefined";
  const isClientReady = typeof document !== "undefined" && document.readyState === "complete";

  // ✅ Minimalus readiness: user, wallet, active network, ir auth nėra loading
  const minimalReady =
    isClient &&
    isClientReady &&
    !!user?.email &&
    !!wallet?.wallet?.address &&
    !!activeNetwork &&
    !authLoading &&
    !walletLoading;

  // ✅ Jei minimalūs reikalavimai neįvykdyti – iškart returninam
  if (!minimalReady) {
    return { ready: false, loading: true };
  }

  // ✅ Balansų readiness: balansai turi būti pakrauti ir loading turi būti pasibaigęs
  const hasBalancesReady =
    !balancesLoading &&
    balances &&
    Object.keys(balances).length >= 0; // ✅ Leisti ir 0 balansų situaciją

  // ✅ READY kai viskas pilnai paruošta
  const ready = minimalReady && hasBalancesReady;
  const loading = !ready;

  return { ready, loading };
}
