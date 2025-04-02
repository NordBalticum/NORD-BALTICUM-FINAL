"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";

import { supabase } from "@/utils/supabaseClient";
import { useMagicLink } from "./MagicLinkContext";

const WalletCheckContext = createContext();

export const WalletCheckProvider = ({ children }) => {
  const { user, setUser } = useMagicLink();
  const [walletReady, setWalletReady] = useState(false);

  useEffect(() => {
    const checkOrCreateWallet = async () => {
      if (!user?.email) return;

      // Tikrinam ar jau yra wallet
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!data) {
        // Naujo wallet generavimas
        const newWallet = ethers.Wallet.createRandom();
        const privateKey = newWallet.privateKey;
        const publicKey = newWallet.address;

        // Šifravimas
        const encryptedPrivateKey = CryptoJS.AES.encrypt(
          privateKey,
          process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key"
        ).toString();

        // Įrašymas į DB
        const { error: insertError } = await supabase.from("wallets").insert([
          {
            email: user.email,
            public_key: publicKey,
            encrypted_private_key: encryptedPrivateKey,
            created_at: new Date().toISOString(),
          },
        ]);

        if (insertError) {
          console.error("❌ Wallet insert error:", insertError.message);
          return;
        }

        // Pridėti naują wallet į user objektą
        setUser((prev) => ({
          ...prev,
          wallet_address: publicKey,
        }));
      } else {
        // Jei jau egzistuoja – įrašom į user objektą
        setUser((prev) => ({
          ...prev,
          wallet_address: data.public_key,
        }));
      }

      setWalletReady(true);
    };

    checkOrCreateWallet();
  }, [user, setUser]);

  return (
    <WalletCheckContext.Provider value={{ walletReady }}>
      {walletReady && children}
    </WalletCheckContext.Provider>
  );
};

export const useWalletCheck = () => useContext(WalletCheckContext);
