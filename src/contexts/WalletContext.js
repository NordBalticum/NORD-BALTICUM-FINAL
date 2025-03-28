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

  const NETWORKS = ["BNB", "ETH", "MATIC", "AVAX", "TBNB"];

  useEffect(() => {
    if (loadingUser || !user) return;

    const initWallet = async () => {
      setLoadingWallet(true);

      try {
        // 1. Fetch wallet from Supabase
        const { data: existing, error: fetchError } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("❌ Wallet fetch error:", fetchError.message);
          setLoadingWallet(false);
          return;
        }

        let walletAddress = existing?.address;

        // 2. If wallet doesn't exist, create and insert
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
            console.error("❌ Wallet insert error:", insertError.message);
            setLoadingWallet(false);
            return;
          }

          // 3. Create initial balances per network
          const balanceRows = NETWORKS.map((net) => ({
            user_id: user.id,
            wallet_address: walletAddress,
            wallet_id: null, // will be assigned automatically via Supabase trigger or follow-up
            network: net,
            amount: "0.0000",
            eur: "0.00",
          }));

          await supabase.from("balances").insert(balanceRows);

          console.log("✅ New wallet created and balances initialized.");
        }

        // 4. Set wallet state
        setWallet({ address: walletAddress });

        // 5. Fetch balances
        const { data: balanceData, error: balanceError } = await supabase
          .from("balances")
          .select("*")
          .eq("wallet_address", walletAddress);

        if (balanceError) {
          console.error("❌ Balance fetch error:", balanceError.message);
        }

        const parsed = {};
        balanceData?.forEach((b) => {
          parsed[b.network] = {
            amount: b.amount || "0.0000",
            eur: b.eur || "0.00",
          };
        });

        setBalances(parsed);
      } catch (e) {
        console.error("❌ Wallet system error:", e.message);
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
