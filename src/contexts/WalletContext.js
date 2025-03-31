"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/lib/supabase";
import { useMagicLink } from "./MagicLinkContext";
import CryptoJS from "crypto-js";

const WalletContext = createContext();
const ENCRYPTION_KEY = "NORD-BALTICUM-2025-SECRET";

const NETWORKS = ["BNB", "TBNB", "ETH", "MATIC", "AVAX"];

export function WalletProvider({ children }) {
  const { user, loadingUser } = useMagicLink();
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState({});
  const [loadingWallet, setLoadingWallet] = useState(true);

  const encrypt = (text) => CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  const decrypt = (cipher) => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  };

  const storePrivateKeyLocal = (pk) => {
    if (!pk) return;
    const encrypted = encrypt(pk);
    localStorage.setItem("nbc_encrypted_key", encrypted);
  };

  const getPrivateKeyLocal = () => {
    const cipher = localStorage.getItem("nbc_encrypted_key");
    return cipher ? decrypt(cipher) : null;
  };

  const saveBalancesToDB = async (walletAddress, rawData) => {
    const rows = NETWORKS.map((net) => ({
      user_id: user.id,
      wallet_address: walletAddress,
      network: net,
      amount: rawData?.[net]?.amount || "0.00000",
      eur: rawData?.[net]?.eur || "0.00",
    }));

    await supabase.from("balances").upsert(rows, {
      onConflict: ["user_id", "wallet_address", "network"],
    });
  };

  const fetchOrCreateWallet = async () => {
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (data?.address) return data;

    const newWallet = ethers.Wallet.createRandom();
    storePrivateKeyLocal(newWallet.privateKey);

    const { error: insertError } = await supabase.from("wallets").insert([
      {
        user_id: user.id,
        address: newWallet.address,
        network: "multi",
      },
    ]);

    if (insertError) throw insertError;

    return { address: newWallet.address };
  };

  const loadBalances = async (walletAddress) => {
    const { data, error } = await supabase
      .from("balances")
      .select("*")
      .eq("wallet_address", walletAddress);

    if (error) {
      console.error("❌ Balance fetch failed:", error.message);
      return {};
    }

    const result = {};
    data.forEach((entry) => {
      result[entry.network] = {
        amount: entry.amount || "0.00000",
        eur: entry.eur || "0.00",
      };
    });

    return result;
  };

  useEffect(() => {
    if (!user || loadingUser) return;

    const init = async () => {
      setLoadingWallet(true);
      try {
        const walletData = await fetchOrCreateWallet();
        setWallet({ address: walletData.address });

        const currentBalances = await loadBalances(walletData.address);
        setBalances(currentBalances);

        await saveBalancesToDB(walletData.address, currentBalances);
      } catch (e) {
        console.error("❌ WalletContext error:", e.message);
      } finally {
        setLoadingWallet(false);
      }
    };

    init();
  }, [user, loadingUser]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        balances,
        loadingWallet,
        getPrivateKeyLocal,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
