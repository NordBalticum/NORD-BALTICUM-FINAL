"use client";

/**
 * useIsAdmin — Final Supabase Role Detection Hook (MetaMask-grade)
 * ================================================================
 * Tikrina ar prisijungęs vartotojas yra administratorius (`admins` lentelė).
 * - Naudoja Supabase `.maybeSingle()` (grąžina `null` jei nerasta)
 * - Automatinis el. pašto tikrinimas iš AuthContext
 * - Apsaugotas nuo SSR, saugus, nekelia klaidų, paruoštas deploy
 */

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabaseClient";

export function useIsAdmin() {
  const { user } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(!!user?.email);
  const [error, setError] = useState(null);

  const checkAdmin = useCallback(async () => {
    if (!user?.email) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: supaError } = await supabase
        .from("admins")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (supaError && supaError.code !== "PGRST116") {
        console.warn("❌ Supabase error (isAdmin):", supaError.message);
        setError(supaError.message);
      }

      setIsAdmin(!!data);
    } catch (err) {
      console.error("❌ Unexpected error (useIsAdmin):", err.message);
      setError(err.message || "Unknown error");
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  return {
    isAdmin,  // boolean: true if user is in `admins` table
    loading,  // boolean: true while checking
    error,    // string|null: error message
  };
}
