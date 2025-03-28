"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";

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
        // Check if wallet already exists in Supabase
        const { data: existing, error } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (existing) {
          // Use existing wallet
          setWallet({
            address: existing.address,
            private_key: existing.private_key,
            id: existing.id,
          });
          setLoadingWallet(false);
          return;
        }

        // If not – generate a new wallet
        const newWallet = ethers.Wallet.createRandom();
        const address = newWallet.address;
        const privateKey = newWallet.privateKey;

        // Save the wallet to Supabase for all networks
        const { error: insertError } = await supabase.from("wallets").insert([
          {
            user_id: user.id,
            address,
            private_key: privateKey,
            eth_address: address,
            bnb_address: address,
            matic_address: address,
            avax_address: address,
            t_address: address,
          },
        ]);

        if (insertError) {
          console.error("❌ Failed to insert new wallet into Supabase:", insertError.message);
        } else {
          console.log("✅ New wallet created:", address);
          setWallet({
            address,
            private_key: privateKey,
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
