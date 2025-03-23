// ✅ Serverless funkcija – balansų sinchronizavimas
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JsonRpcProvider, formatEther } from "npm:ethers";

// ✅ Serve
serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const RPCS = {
    bsc: [
      Deno.env.get("BSC_RPC_1"),
      "https://bsc-dataseed.binance.org",
    ],
    bscTestnet: [
      Deno.env.get("BSC_TESTNET_RPC_1"),
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
    ],
  };

  const getProvider = (network: string) => {
    const urls = RPCS[network] || [];
    for (const url of urls) {
      if (url) return new JsonRpcProvider(url);
    }
    return null;
  };

  const { data: wallets, error } = await supabase
    .from("wallets")
    .select("user_id, address, network");

  if (error) {
    console.error("❌ Failed to fetch wallets:", error);
    return new Response("Failed", { status: 500 });
  }

  for (const wallet of wallets) {
    try {
      const provider = getProvider(wallet.network);
      if (!provider) continue;

      const raw = await provider.getBalance(wallet.address);
      const formatted = parseFloat(formatEther(raw)).toFixed(4);

      await supabase.from("balances").upsert({
        user_id: wallet.user_id,
        network: wallet.network,
        balance_raw: raw.toString(),
        balance_formatted: formatted,
      });

      console.log(`✅ Synced ${wallet.address} (${wallet.network}): ${formatted} BNB`);
    } catch (err) {
      console.error(`❌ Failed to sync ${wallet.address}`, err);
    }
  }

  return new Response("✅ Balances synced", { status: 200 });
});
