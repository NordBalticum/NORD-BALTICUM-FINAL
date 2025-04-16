// pages/api/check-session.js
import { supabase } from "@/utils/supabaseClient";

export default async function handler(req, res) {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) return res.status(500).json({ valid: false, error: error.message });
  if (!session) return res.status(401).json({ valid: false });

  return res.status(200).json({ valid: true });
}
