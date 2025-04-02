import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Missing email parameter." });
  }

  try {
    const { data, error } = await supabase
      .from("balances")
      .select("network, balance")
      .eq("user_email", email);

    if (error) {
      console.error("Supabase error:", error.message);
      return res.status(500).json({ error: "Failed to fetch balances." });
    }

    // Optional: convert to fake EUR value for demo (replace with real oracle later)
    const eurRates = {
      bsc: 270.5,
      tbnb: 0,
      ethereum: 3200,
      polygon: 0.96,
      avalanche: 9.5,
    };

    const mapped = data.map((item) => ({
      network: item.network,
      amount: parseFloat(item.balance || 0),
      eur: (parseFloat(item.balance || 0) * (eurRates[item.network] || 0)).toFixed(2),
    }));

    return res.status(200).json(mapped);
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected error occurred." });
  }
}
