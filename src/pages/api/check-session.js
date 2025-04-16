import { supabase } from "@/utils/supabaseClient";

export default async function handler(req, res) {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.warn("❌ Supabase session error:", error.message);
      return res.status(500).json({ valid: false, error: error.message });
    }

    if (!session || !session.user?.email) {
      return res.status(401).json({ valid: false });
    }

    const userEmail = session.user.email;

    // ✅ Autorizuotas klientas (būtina RLS veikimui)
    const supabaseServer = supabase.auth.setAuth(session.access_token);

    // ✅ Patikrinam, ar yra wallet įrašas pagal user_email – veikia su RLS
    const { data: walletData, error: walletError } = await supabaseServer
      .from("wallets")
      .select("id")
      .eq("user_email", userEmail)
      .maybeSingle();

    if (walletError || !walletData) {
      console.warn("❌ RLS blocked access or wallet not found:", walletError?.message || "No data");
      return res.status(403).json({ valid: false });
    }

    // Galima pridėti papildomų saugumo lygmenų su papildomomis lentelėmis (e.g. `balances`, `transactions`, `kyc`, `users`)

    return res.status(200).json({ valid: true });
  } catch (err) {
    console.error("❌ Critical session API error:", err.message || err);
    return res.status(500).json({ valid: false, error: err.message || "Unknown error" });
  }
}
