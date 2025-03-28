"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/lib/supabaseClient";
import { useMagicLink } from "./MagicLinkContext";

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { user, loadingUser } = useMagicLink();

  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState({});
  const [loadingWallet, setLoadingWallet] = useState(true);

  const NETWORKS = ["BNB", "TBNB", "ETH", "MATIC", "AVAX"];

  useEffect(() => {
    if (loadingUser || !user) return;

    const initWallet = async () => {
      setLoadingWallet(true);

      try {
        // 1. Check if wallet exists
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

        // 2. If not, create wallet and store it
        if (!walletAddress) {
          const newWallet = ethers.Wallet.createRandom();
          walletAddress = newWallet.address;

          const { error: insertError } = await supabase.from("wallets").insert([
            {
              user_id: user.id,
              address: walletAddress,
              eth_address: walletAddress,
              bnb_address: walletAddress,
              matic_address: walletAddress,
              avax_address: walletAddress,
              t_address: walletAddress,
            },
          ]);

          if (insertError) {
            console.error("❌ Failed to insert new wallet:", insertError.message);
            setLoadingWallet(false);
            return;
          }

          // 3. Insert default balances for all networks
          const balanceRows = NETWORKS.map((net) => ({
            user_id: user.id,
            wallet_address: walletAddress,
            network: net,
            amount: "0.0000",
            eur: "0.00",
          }));

          const { error: balanceInsertError } = await supabase
            .from("balances")
            .insert(balanceRows);

          if (balanceInsertError) {
            console.error("❌ Failed to initialize balances:", balanceInsertError.message);
          }

          console.log("✅ New wallet created and balances initialized.");
        }

        // 4. Set wallet to state
        setWallet({ address: walletAddress });

        // 5. Fetch updated balances
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
      } catch (e) {
        console.error("❌ Wallet context system failure:", e.message);
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
