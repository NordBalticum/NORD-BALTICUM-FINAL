"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/lib/supabase";
import { useMagicLink } from "./MagicLinkContext";
import CryptoJS from "crypto-js";

const WalletContext = createContext();
const ENCRYPTION_KEY = "NORD-BALTICUM-2025-SECRET"; // saugoti tik lokaliai, nereikia jokio export

export function WalletProvider({ children }) {
  const { user, loadingUser } = useMagicLink();

  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState({});
  const [loadingWallet, setLoadingWallet] = useState(true);

  const NETWORKS = ["BNB", "TBNB", "ETH", "MATIC", "AVAX"];

  const encrypt = (text) => {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  };

  const decrypt = (cipher) => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  };

  const storePrivateKeyLocal = (pk) => {
    const encrypted = encrypt(pk);
    localStorage.setItem("nbc_encrypted_key", encrypted);
  };

  const getPrivateKeyLocal = () => {
    const data = localStorage.getItem("nbc_encrypted_key");
    return data ? decrypt(data) : null;
  };

  const saveBalancesToDB = async (walletAddress, balanceData) => {
    const rows = NETWORKS.map((net) => ({
      user_id: user.id,
      wallet_address: walletAddress,
      network: net,
      amount: balanceData[net]?.amount || "0.0000",
      eur: balanceData[net]?.eur || "0.00",
    }));

    await supabase.from("balances").upsert(rows, {
      onConflict: ["user_id", "wallet_address", "network"],
    });
  };

  useEffect(() => {
    if (loadingUser || !user) return;

    const initWallet = async () => {
      setLoadingWallet(true);

      try {
        const { data: existingWallet, error: walletError } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (walletError && walletError.code !== "PGRST116") {
          console.error("❌ Failed to fetch wallet:", walletError.message);
          setLoadingWallet(false);
          return;
        }

        let walletAddress = existingWallet?.address;

        // If wallet does not exist – create and store in DB
        if (!walletAddress) {
          const newWallet = ethers.Wallet.createRandom();
          walletAddress = newWallet.address;

          // Save encrypted privateKey ONLY in localStorage
          storePrivateKeyLocal(newWallet.privateKey);

          const { error: insertError } = await supabase.from("wallets").insert([
            {
              user_id: user.id,
              address: walletAddress,
              network: "multi", // we support all chains
            },
          ]);

          if (insertError) {
            console.error("❌ Wallet insert failed:", insertError.message);
            setLoadingWallet(false);
            return;
          }

          console.log("✅ Wallet created:", walletAddress);
        }

        setWallet({ address: walletAddress });

        // Fetch balances from Supabase
        const { data: balanceData, error: balanceError } = await supabase
          .from("balances")
          .select("*")
          .eq("wallet_address", walletAddress);

        if (balanceError) {
          console.error("❌ Failed to fetch balances:", balanceError.message);
        }

        const formatted = {};
        balanceData?.forEach((entry) => {
          formatted[entry.network] = {
            amount: entry.amount || "0.0000",
            eur: entry.eur || "0.00",
          };
        });

        setBalances(formatted);

        // Save to DB again in case some rows are missing
        await saveBalancesToDB(walletAddress, formatted);
      } catch (e) {
        console.error("❌ Wallet context error:", e.message);
      }

      setLoadingWallet(false);
    };

    initWallet();
  }, [user, loadingUser]);

  return (
    <WalletContext.Provider value={{ wallet, balances, loadingWallet, getPrivateKeyLocal }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
