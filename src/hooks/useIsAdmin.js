import { supabase } from "@/utils/supabaseClient";

export async function isAdmin(email) {
  const { data, error } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    console.warn("Admin check error:", error.message);
  }

  return !!data;
}
