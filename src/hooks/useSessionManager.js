// src/hooks/useSessionManager.ts
import { useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSystemReady } from "./useSystemReady";

export function useSessionManager() {
  const { ready } = useSystemReady();
  const { signOut, safeRefreshSession } = useAuth();
  const { refetch } = useBalance();
  const failureCount = useRef(0);

  // visibility / focus / online → refresh
  useEffect(() => {
    if (!ready) return;
    const run = async () => {
      try {
        await safeRefreshSession();
        await refetch();
        failureCount.current = 0;
      } catch {
        if (++failureCount.current >= 3) {
          toast.error("⚠️ Session expired. Logging out…");
          signOut(true);
        }
      }
    };
    const onVis   = debounce(run, 300);
    const onFocus = debounce(run, 300);
    const onOnline= debounce(run, 300);

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    return () => {
      onVis.cancel();
      onFocus.cancel();
      onOnline.cancel();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [ready, safeRefreshSession, refetch, signOut]);
}
