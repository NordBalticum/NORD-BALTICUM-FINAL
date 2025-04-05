"use client";

import { supabase } from "@/utils/supabaseClient";

export async function fetchTransactions(userEmail) {
  if (!userEmail) return [];

  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ fetchTransactions error:", error.message);
    return [];
  }
}
