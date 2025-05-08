"use client";

/**
 * useIsAdmin — Supabase Role Detection Hook
 * ==========================================
 * Tikrina ar user yra administratorius iš `admins` lentelės.
 * Visiškai saugus, SSR-aware, integruotas su AuthContext.
 * 
 * - Tikrina tik jei yra prisijungęs vartotojas su el. paštu
 * - Naudoja `.single()` + `maybeSingle()` fallback
 * - Grąžina `isAdmin`, `loading`, ir `error`
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabaseClient";

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const checkAdmin = async () => {
      setLoading(true);
      setError(null);

      if (!user?.email) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error: supaError } = await supabase
          .from("admins")
          .select("id")
          .eq("email", user.email)
          .maybeSingle();

        if (cancelled) return;

        if (supaError && supaError.code !== "PGRST116") {
          console.warn("❌ Admin check error:", supaError.message);
          setError(supaError);
        }

        setIsAdmin(!!data);
      } catch (err) {
        console.error("❌ Admin check unexpected error:", err);
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return { isAdmin, loading, error };
}
