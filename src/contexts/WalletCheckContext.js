"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import CryptoJS from "crypto-js";

const WalletCheckContext = createContext();

export const WalletCheckProvider = ({ children }) => {
  const { user, setUser } = useMagicLink();

  const [walletReady, setWalletReady] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(true);

  useEffect(() => {
    const checkOrCreateWallet = async () => {
      if (!user?.email) {
        setLoadingWallet(false);
        return;
      }

      try {
        // 1. Tikrinam ar jau yra wallet priskirtas
        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .eq("email", user.email)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("❌ Supabase wallet fetch error:", error.message);
          setLoadingWallet(false);
          return;
        }

        if (!data) {
          // 2. Jei nėra – kuriam naują wallet
          const newWallet = ethers.Wallet.createRandom();
          const privateKey = newWallet.privateKey;
          const publicKey = newWallet.address;

          const encryptedPrivateKey = CryptoJS.AES.encrypt(
            privateKey,
            process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "nordbalticum"
          ).toString();

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
            setLoadingWallet(false);
            return;
          }

          // 3. Updatinam vartotoją su nauju wallet lokaliai
          setUser((prev) => ({
            ...prev,
            wallet: {
              address: publicKey,
              encrypted: encryptedPrivateKey,
            },
          }));
        } else {
          // 4. Jeigu jau yra – išsaugom į context
          setUser((prev) => ({
            ...prev,
            wallet: {
              address: data.public_key,
              encrypted: data.encrypted_private_key,
            },
          }));
        }

        setWalletReady(true);
      } catch (err) {
        console.error("❌ Wallet check error:", err.message);
      } finally {
        setLoadingWallet(false);
      }
    };

    checkOrCreateWallet();
  }, [user?.email, setUser]);

  return (
    <WalletCheckContext.Provider value={{ walletReady, loadingWallet }}>
      {children}
    </WalletCheckContext.Provider>
  );
};

export const useWalletCheck = () => useContext(WalletCheckContext);
