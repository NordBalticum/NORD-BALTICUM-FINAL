"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import CryptoJS from "crypto-js";
import { useMagicLink } from "./MagicLinkContext";

const WalletContext = createContext();

const RPC_URLS = {
  bsc: ["https://bsc-dataseed.binance.org"],
  tbnb: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
  eth: ["https://rpc.ankr.com/eth"],
  matic: ["https://polygon-rpc.com"],
  avax: ["https://api.avax.network/ext/bc/C/rpc"],
};

export const WalletProvider = ({ children }) => {
  const { user } = useMagicLink();
  const [wallet, setWallet] = useState(null);
  const [activeNetwork, setActiveNetwork] = useState("bsc");
  const [balance, setBalance] = useState("0.00000");

  const getProvider = (net) => new ethers.providers.JsonRpcProvider(RPC_URLS[net][0]);

  useEffect(() => {
    const loadWallet = async () => {
      if (!user?.email) return;

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("email", user.email)
        .eq("network", activeNetwork)
        .single();

      if (!data || error) return;

      const decrypted = CryptoJS.AES.decrypt(
        data.encrypted_private_key,
        process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key"
      ).toString(CryptoJS.enc.Utf8);

      const provider = getProvider(activeNetwork);
      const loaded = new ethers.Wallet(decrypted, provider);
      setWallet(loaded);

      const raw = await loaded.getBalance();
      setBalance(ethers.utils.formatEther(raw));
    };

    loadWallet();
  }, [user, activeNetwork]);

  return (
    <WalletContext.Provider value={{
      wallet,
      address: wallet?.address || null,
      activeNetwork,
      setActiveNetwork,
      balance,
    }}>
      {wallet && children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
