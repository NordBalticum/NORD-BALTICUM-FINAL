// /supabase/functions/update-balances.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JsonRpcProvider, formatEther } from "https://esm.sh/ethers@6";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

const RPC_URL = Deno.env.get("BSC_RPC") || "https://bsc-dataseed.binance.org/";

Deno.serve(async (req) => {
  const provider = new JsonRpcProvider(RPC_URL);

  // Gaunam visus wallet adresus
  const { data: wallets, error } = await supabase
    .from("wallets")
    .select("user_id, address, network");

  if (error) return new Response("❌ Failed to fetch wallets", { status: 500 });

  for (const wallet of wallets) {
    try {
      const raw = await provider.getBalance(wallet.address);
      const formatted = parseFloat(formatEther(raw)).toFixed(4);

      await supabase.from("balances").upsert({
        user_id: wallet.user_id,
        network: wallet.network || "bsc",
        balance_raw: raw.toString(),
        balance_formatted: formatted,
      });
    } catch (err) {
      console.error("❌ RPC error for wallet:", wallet.address);
    }
  }

  return new Response("✅ Balances updated successfully");
});
