// hooks/useAdmin.js

"use client";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function useAdmin() {
  const { user } = useMagicLink();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("email", user.email)
        .single();

      if (error || !data?.role) {
        setIsAdmin(false);
      } else {
        setIsAdmin(data.role === "admin");
      }

      setLoading(false);
    };

    checkRole();
  }, [user]);

  return { isAdmin, loading };
}
