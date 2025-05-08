"use client";

/**
 * useIsAdmin — Supabase Role Detection Hook
 * ==========================================
 * Tikrina ar user yra administratorius iš `admins` lentelės.
 * Visiškai saugus, SSR-aware, integruotas su AuthContext.
 * 
 * - Tikrina tik jei yra prisijungęs vartotojas su el. paštu
 * - Naudoja `.maybeSingle()` (negrąžina klaidos, jei nėra)
 * - Visiškai SSR‑saugus
 * - Grąžina `isAdmin`, `loading`, `error`
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
        console.warn("❌ Supabase error:", supaError.message);
        setError(supaError);
      }

      setIsAdmin(!!data);
    } catch (err) {
      console.error("❌ Unexpected admin check error:", err.message);
      setError(err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  return { isAdmin, loading, error };
}
