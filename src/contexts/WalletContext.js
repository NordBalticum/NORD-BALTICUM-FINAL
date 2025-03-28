"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";

// SHA-256 hashing helper
async function hashPrivateKey(privateKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(privateKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchOrCreateWallet = async () => {
      setLoadingWallet(true);

      try {
        // 1. Check if wallet already exists in Supabase
        const { data: existing, error: fetchError } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("❌ Error fetching wallet from Supabase:", fetchError.message);
          setLoadingWallet(false);
          return;
        }

        // 2. If wallet exists – use it
        if (existing) {
          setWallet({
            address: existing.address,
            private_key: existing.private_key,
            id: existing.id,
          });
          setLoadingWallet(false);
          return;
        }

        // 3. If not – generate a new wallet
        const newWallet = ethers.Wallet.createRandom();
        const address = newWallet.address;
        const privateKey = newWallet.privateKey;
        const hashedKey = await hashPrivateKey(privateKey);

        // 4. Insert new wallet into Supabase for all networks
        const { error: insertError } = await supabase.from("wallets").insert([
          {
            user_id: user.id,
            address,
            private_key: hashedKey,
            eth_address: address,
            bnb_address: address,
            matic_address: address,
            avax_address: address,
            t_address: address,
            network: "multi",
          },
        ]);

        if (insertError) {
          console.error("❌ Failed to insert wallet:", insertError.message);
        } else {
          console.log("✅ New wallet created and stored:", address);
          setWallet({
            address,
            private_key: hashedKey,
          });
        }
      } catch (e) {
        console.error("❌ Wallet generation error:", e.message);
      }

      setLoadingWallet(false);
    };

    fetchOrCreateWallet();
  }, [user]);

  return (
    <WalletContext.Provider value={{ wallet, loadingWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
