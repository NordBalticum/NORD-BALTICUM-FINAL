"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";
import sha256 from "crypto-js/sha256";

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
        // 1. Check if wallet already exists
        const { data: existing, error: fetchError } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (existing) {
          setWallet({
            address: existing.address,
            private_key: existing.private_key,
            id: existing.id,
          });
          setLoadingWallet(false);
          return;
        }

        // 2. Generate new wallet
        const newWallet = ethers.Wallet.createRandom();
        const address = newWallet.address;
        const privateKey = newWallet.privateKey;

        // 3. Hash the private key (for added security)
        const hashedKey = sha256(privateKey).toString();

        // 4. Insert wallet to Supabase (assign one address to all networks)
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
          },
        ]);

        if (insertError) {
          console.error("❌ Failed to insert wallet:", insertError.message);
        } else {
          console.log("✅ New wallet created:", address);
          setWallet({
            address,
            private_key: privateKey,
          });
        }
      } catch (err) {
        console.error("❌ Wallet creation error:", err.message);
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
