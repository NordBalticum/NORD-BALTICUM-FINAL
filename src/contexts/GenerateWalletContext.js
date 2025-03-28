// src/contexts/GenerateWalletContext.js
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";

const GenerateWalletContext = createContext();

export function GenerateWalletProvider({ children }) {
  const { user } = useAuth();
  const [walletCreated, setWalletCreated] = useState(false);

  useEffect(() => {
    const createAndStoreWallet = async () => {
      if (!user || walletCreated) return;

      const { data: existing, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        console.log("✅ Wallet jau sukurtas");
        setWalletCreated(true);
        return;
      }

      try {
        const newWallet = ethers.Wallet.createRandom();
        const privateKey = newWallet.privateKey;
        const address = newWallet.address;

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
          console.error("❌ Wallet įrašymo klaida:", insertError.message);
        } else {
          console.log("✅ Naujas wallet sukurtas:", address);
          setWalletCreated(true);
        }
      } catch (e) {
        console.error("❌ Wallet creation failed:", e.message);
      }
    };

    createAndStoreWallet();
  }, [user, walletCreated]);

  return (
    <GenerateWalletContext.Provider value={{}}>
      {children}
    </GenerateWalletContext.Provider>
  );
}

export const useGenerateWallet = () => useContext(GenerateWalletContext);
