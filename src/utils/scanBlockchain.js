"use client";

import { supabase } from "@/utils/supabaseClient";
import axios from "axios";
import { ethers } from "ethers";

// Explorer API endpoint'ai
const explorers = {
  bnb: {
    apiUrl: "https://api.bscscan.com/api",
    apiKey: process.env.NEXT_PUBLIC_BSCSCAN_API_KEY,
  },
  tbnb: {
    apiUrl: "https://api-testnet.bscscan.com/api",
    apiKey: process.env.NEXT_PUBLIC_TBSCSCAN_API_KEY,
  },
  eth: {
    apiUrl: "https://api.etherscan.io/api",
    apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
  },
  polygon: {
    apiUrl: "https://api.polygonscan.com/api",
    apiKey: process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY,
  },
  avax: {
    apiUrl: "https://api.snowtrace.io/api",
    apiKey: process.env.NEXT_PUBLIC_SNOWTRACE_API_KEY,
  },
};

// RPC fallback URL'ai
const RPC_URLS = {
  bnb: "https://bsc-dataseed.bnbchain.org",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
  eth: "https://rpc.ankr.com/eth",
  polygon: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

export async function scanBlockchain(address, userEmail) {
  if (!address || !userEmail) return;

  try {
    for (const [networkKey, config] of Object.entries(explorers)) {
      const { apiUrl, apiKey } = config;

      if (!apiKey) {
        console.warn(`❌ Missing API Key for ${networkKey}`);
        continue;
      }

      const url = `${apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

      try {
        const response = await axios.get(url);

        if (response.data.status !== "1") {
          console.warn(`❌ No transactions from Explorer API on ${networkKey}`);
          throw new Error("Explorer API Empty");
        }

        const transactions = response.data.result;

        for (const tx of transactions) {
          if (tx.to?.toLowerCase() !== address.toLowerCase()) continue;

          const { data: existingTx } = await supabase
            .from("transactions")
            .select("tx_hash")
            .eq("tx_hash", tx.hash)
            .single();

          if (!existingTx) {
            await supabase.from("transactions").insert([
              {
                sender_address: tx.from,
                receiver_address: tx.to,
                amount: Number(tx.value) / 1e18,
                network: networkKey,
                type: "receive",
                tx_hash: tx.hash,
                status: tx.isError === "0" ? "completed" : "failed",
                user_email: userEmail,
              },
            ]);
          }
        }

        console.log(`✅ Synced from Explorer: ${networkKey}`);
      } catch (apiError) {
        console.warn(`⚡ Fallback to RPC on ${networkKey}`);

        const provider = new ethers.JsonRpcProvider(RPC_URLS[networkKey]);
        const history = await provider.getHistory(address);

        if (history.length > 0) {
          for (const tx of history.reverse()) {
            if (tx.to?.toLowerCase() !== address.toLowerCase()) continue;

            const { data: existingTx } = await supabase
              .from("transactions")
              .select("tx_hash")
              .eq("tx_hash", tx.hash)
              .single();

            if (!existingTx) {
              await supabase.from("transactions").insert([
                {
                  sender_address: tx.from,
                  receiver_address: tx.to,
                  amount: Number(ethers.formatEther(tx.value)),
                  network: networkKey,
                  type: "receive",
                  tx_hash: tx.hash,
                  status: tx.confirmations > 0 ? "completed" : "pending",
                  user_email: userEmail,
                },
              ]);
            }
          }
          console.log(`✅ Synced from RPC: ${networkKey}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ scanBlockchain error:", error.message || error);
  }
}
