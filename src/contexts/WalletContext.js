"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/lib/supabase";
import { useMagicLink } from "./MagicLinkContext";

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { user, loadingUser } = useMagicLink();

  const [wallet, setWallet] = useState({ list: [] });
  const [balances, setBalances] = useState({});
  const [loadingWallet, setLoadingWallet] = useState(true);

  // Palaikomi tinklai
  const NETWORKS = [
    { key: "bsc", name: "BNB Chain" },
    { key: "tbnb", name: "BNB Testnet" },
    { key: "ethereum", name: "Ethereum" },
    { key: "polygon", name: "Polygon" },
    { key: "avalanche", name: "Avalanche" },
  ];

  useEffect(() => {
    if (loadingUser || !user) return;

    const initWallet = async () => {
      setLoadingWallet(true);

      try {
        // 1. Gauti visus pinigines įrašus šiam user
        const { data: walletData, error: walletError } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id);

        if (walletError) {
          console.error("❌ Failed to fetch wallet list:", walletError.message);
          setLoadingWallet(false);
          return;
        }

        let updatedWallets = [...walletData];

        // 2. Jei nėra jokių adresų – sugeneruoti vieną adresą visiems tinklams
        if (walletData.length === 0) {
          const newWallet = ethers.Wallet.createRandom();
          const baseAddress = newWallet.address;

          const newEntries = NETWORKS.map((net) => ({
            user_id: user.id,
            network: net.key,
            address: baseAddress,
            private_key: newWallet.privateKey,
          }));

          const { error: insertError } = await supabase
            .from("wallets")
            .insert(newEntries);

          if (insertError) {
            console.error("❌ Failed to insert wallet entries:", insertError.message);
            setLoadingWallet(false);
            return;
          }

          updatedWallets = newEntries;
          console.log("✅ New wallets created.");
        }

        // 3. Formatuoti wallet sąrašą
        const walletList = updatedWallets.map((w) => ({
          network: w.network,
          address: w.address,
        }));

        setWallet({ list: walletList });

        // 4. Fetch balances
        const { data: balanceData, error: balanceError } = await supabase
          .from("balances")
          .select("*")
          .eq("user_id", user.id);

        if (balanceError) {
          console.error("❌ Failed to fetch balances:", balanceError.message);
        }

        const formatted = {};
        balanceData?.forEach((entry) => {
          formatted[entry.network] = {
            raw: entry.raw_balance || "0",
            formatted: entry.formatted_balance || "0.0000",
            eur: entry.balance_formatted || "0.00",
          };
        });

        setBalances(formatted);
      } catch (e) {
        console.error("❌ WalletContext critical error:", e.message);
      }

      setLoadingWallet(false);
    };

    initWallet();
  }, [user, loadingUser]);

  return (
    <WalletContext.Provider value={{ wallet, balances, loadingWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
