"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import { useMagicLink } from "./MagicLinkContext";

const WalletCheckContext = createContext();

export const WalletCheckProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [walletReady, setWalletReady] = useState(false);

  useEffect(() => {
    const checkWallet = async () => {
      if (!user?.email) return;

      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!data) {
        const newWallet = ethers.Wallet.createRandom();
        const encrypted = CryptoJS.AES.encrypt(
          newWallet.privateKey,
          process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key"
        ).toString();

        await supabase.from("wallets").insert([
          {
            email: user.email,
            public_key: newWallet.address,
            encrypted_private_key: encrypted,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      setWalletReady(true);
    };

    checkWallet();
  }, [user]);

  return (
    <WalletCheckContext.Provider value={{ walletReady }}>
      {walletReady && children}
    </WalletCheckContext.Provider>
  );
};

export const useWalletCheck = () => useContext(WalletCheckContext);
