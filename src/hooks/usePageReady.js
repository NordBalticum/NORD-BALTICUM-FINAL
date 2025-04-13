"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * ULTRA-ULTIMATE PageReady Hook
 * - Užtikrina, kad AuthContext pilnai paruoštas
 * - Tikrina ar user yra prisijungęs arba atsijungęs
 */
export function usePageReady() {
  const { user, authLoading, walletLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);

  // ✅ Patikrinam ar naršyklė (kad išvengti SSR problemų)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  // ✅ Kai tik AuthContext ir Wallet paruošti
  useEffect(() => {
    if (isClient && !authLoading && !walletLoading) {
      setIsPageReady(true);
    }
  }, [isClient, authLoading, walletLoading]);

  return isPageReady;
}
