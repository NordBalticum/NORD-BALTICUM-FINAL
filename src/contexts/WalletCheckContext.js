"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import CryptoJS from "crypto-js";
import { useMagicLink } from "./MagicLinkContext";

const WalletCheckContext = createContext();

export const WalletCheckProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [walletReady, setWalletReady] = useState(false);

  useEffect(() => {
    const createIfNeeded = async () => {
      if (!user?.email) return;

      const { data } = await supabase.from("wallets").select("*").eq("email", user.email).single();

      if (!data) {
        const newWallet = ethers.Wallet.createRandom();
        const privateKey = newWallet.privateKey;
        const address = newWallet.address;

        const encryptedKey = CryptoJS.AES.encrypt(
          privateKey,
          process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key"
        ).toString();

        await supabase.from("wallets").insert({
          email: user.email,
          network: "bsc",
          address,
          encrypted_private_key: encryptedKey,
          created_at: new Date(),
        });
      }

      setWalletReady(true);
    };

    createIfNeeded();
  }, [user]);

  return (
    <WalletCheckContext.Provider value={{ walletReady }}>
      {walletReady && children}
    </WalletCheckContext.Provider>
  );
};

export const useWalletCheck = () => useContext(WalletCheckContext);
