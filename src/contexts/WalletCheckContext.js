import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useMagicLink } from "./MagicLinkContext";
import CryptoJS from "crypto-js";

const WalletCheckContext = createContext();

export const WalletCheckProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [walletReady, setWalletReady] = useState(false);

  useEffect(() => {
    const checkOrCreateWallet = async () => {
      if (!user?.email) return;

      // Patikrinam ar jau yra wallet DB
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!data) {
        // Generuojam naują wallet
        const newWallet = ethers.Wallet.createRandom();
        const privateKey = newWallet.privateKey;
        const publicKey = newWallet.address;

        // Šifruojam private key su slaptažodžiu
        const encryptedPrivateKey = CryptoJS.AES.encrypt(
          privateKey,
          process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key"
        ).toString();

        // Įrašom į supabase
        const { error: insertError } = await supabase.from("wallets").insert([
          {
            email: user.email,
            public_key: publicKey,
            encrypted_private_key: encryptedPrivateKey,
            created_at: new Date(),
          },
        ]);

        if (insertError) console.error("Wallet insert error:", insertError.message);
      }

      setWalletReady(true);
    };

    checkOrCreateWallet();
  }, [user]);

  return (
    <WalletCheckContext.Provider value={{ walletReady }}>
      {walletReady && children}
    </WalletCheckContext.Provider>
  );
};

export const useWalletCheck = () => useContext(WalletCheckContext);
