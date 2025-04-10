"use client";

import { supabase } from "@/utils/supabaseClient";
import axios from "axios";
import { ethers } from "ethers";
import { toast } from "react-hot-toast"; // ✅ Toast žinutėms

// ✅ Explorer API endpoint'ai
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
    apiKey: null, // ❗ Snowtrace API key nereikia
  },
};

// ✅ RPC fallback URL'ai
const RPC_URLS = {
  bnb: "https://bsc-dataseed.bnbchain.org",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
  eth: "https://rpc.ankr.com/eth",
  polygon: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

// ✅ Tobula scanBlockchain funkcija
export async function scanBlockchain(address, userEmail) {
  if (!address || !userEmail) return;

  try {
    for (const [networkKey, config] of Object.entries(explorers)) {
      const { apiUrl, apiKey } = config;

      let transactions = [];

      // 1. Bandome su Explorer API
      if (apiKey) {
        try {
          const url = `${apiUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
          const response = await axios.get(url);

          if (response.data.status === "1" && response.data.result.length > 0) {
            transactions = response.data.result;
            console.log(`✅ Synced from Explorer: ${networkKey}`);
          } else {
            console.warn(`❌ Explorer API Empty or Error: ${networkKey}`);
          }
        } catch (error) {
          console.warn(`⚠️ Explorer API error on ${networkKey}:`, error.message || error);
        }
      }

      // 2. Jei Explorer nepavyko arba neturime API key – fallback į RPC
      if (transactions.length === 0) {
        try {
          const provider = new ethers.JsonRpcProvider(RPC_URLS[networkKey]);
          const history = await provider.getHistory(address);

          if (history.length > 0) {
            transactions = history.map(tx => ({
              from: tx.from,
              to: tx.to,
              value: tx.value.toString(),
              hash: tx.hash,
              isError: "0",
              confirmations: tx.confirmations,
            }));
            console.log(`✅ Synced from RPC: ${networkKey}`);
          }
        } catch (error) {
          console.error(`❌ RPC error on ${networkKey}:`, error.message || error);
        }
      }

      // 3. Įrašom RECEIVE ir SEND transakcijas į Supabase
      for (const tx of transactions) {
        const isSender = tx.from?.toLowerCase() === address.toLowerCase();
        const isReceiver = tx.to?.toLowerCase() === address.toLowerCase();

        if (!isSender && !isReceiver) continue; // Ignore if not related

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
              amount: tx.value ? Number(ethers.formatEther(tx.value)) : Number(tx.value) / 1e18,
              network: networkKey,
              type: isSender ? "send" : "receive", // ✅ receive arba send
              tx_hash: tx.hash,
              status: tx.isError === "0" ? "completed" : "failed",
              user_email: userEmail,
            },
          ]);
        }
      }
    }

    // ✅ Toast žinutė kai viskas pabaigta
    toast.success("✅ Blockchain fully synced!");
  } catch (error) {
    console.error("❌ scanBlockchain error:", error.message || error);
    toast.error("❌ Blockchain scan failed.");
  }
}
