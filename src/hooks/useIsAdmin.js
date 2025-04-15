"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabaseClient";

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true);
      if (!user?.email) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("admins")
        .select("id")
        .eq("email", user.email)
        .single();

      if (error && error.code !== "PGRST116") {
        console.warn("Admin check error:", error.message);
      }

      setIsAdmin(!!data);
      setLoading(false);
    };

    checkAdmin();
  }, [user?.email]);

  return { isAdmin, loading };
}
