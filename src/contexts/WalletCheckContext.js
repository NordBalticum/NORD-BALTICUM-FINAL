"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useMagicLink } from "./MagicLinkContext";
import CryptoJS from "crypto-js";

const WalletCheckContext = createContext();

export const WalletCheckProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [walletReady, setWalletReady] = useState(false);
  const [checking, setChecking] = useState(true); // papildomai UI galima naudot

  useEffect(() => {
    const checkOrCreateWallet = async () => {
      if (!user?.email) {
        setWalletReady(false);
        return;
      }

      setChecking(true);
      try {
        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .eq("email", user.email)
          .single();

        if (data) {
          // Wallet jau yra – pažymim kaip ready
          setWalletReady(true);
        } else {
          // Wallet nėra – kuriam naują
          const newWallet = ethers.Wallet.createRandom();
          const privateKey = newWallet.privateKey;
          const publicKey = newWallet.address;

          const encrypted = CryptoJS.AES.encrypt(
            privateKey,
            process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key"
          ).toString();

          const { error: insertError } = await supabase.from("wallets").insert([
            {
              email: user.email,
              public_key: publicKey,
              encrypted_private_key: encrypted,
              created_at: new Date(),
            },
          ]);

          if (insertError) {
            console.error("❌ Wallet creation failed:", insertError.message);
            setWalletReady(false);
            return;
          }

          setWalletReady(true);
        }
      } catch (err) {
        console.error("❌ WalletCheck error:", err.message);
        setWalletReady(false);
      } finally {
        setChecking(false);
      }
    };

    checkOrCreateWallet();
  }, [user]);

  return (
    <WalletCheckContext.Provider value={{ walletReady, checking }}>
      {children}
    </WalletCheckContext.Provider>
  );
};

export const useWalletCheck = () => useContext(WalletCheckContext);
