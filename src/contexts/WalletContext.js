"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { fetchPrices } from "@/utils/fetchPrices";
import { supabase } from "@/utils/supabaseClient";

const WalletContext = createContext();

const RPCS = {
  bsc: "https://bsc-dataseed.binance.org",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
  eth: "https://eth.llamarpc.com",
  polygon: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

const SUPPORTED_NETWORKS = ["bsc", "tbnb", "eth", "polygon", "avax"];

export const WalletProvider = ({ children }) => {
  const { user, privateKey, publicKey } = useMagicLink();

  const [balances, setBalances] = useState({});
  const [eurValues, setEurValues] = useState({});
  const [loading, setLoading] = useState(true);

  const getProvider = (network) => new ethers.providers.JsonRpcProvider(RPCS[network]);

  const getWalletBalance = useCallback(async (network) => {
    if (!publicKey) return "0.00000";
    try {
      const provider = getProvider(network);
      const raw = await provider.getBalance(publicKey);
      return parseFloat(ethers.utils.formatEther(raw)).toFixed(5);
    } catch {
      return "0.00000";
    }
  }, [publicKey]);

  const refreshAllBalances = useCallback(async () => {
    if (!user?.email || !publicKey) return;

    try {
      const prices = await fetchPrices();
      const updated = {};
      const eur = {};

      for (const net of SUPPORTED_NETWORKS) {
        const amount = await getWalletBalance(net);
        updated[net] = amount;
        eur[net] = (parseFloat(amount) * (prices[net.toUpperCase()] || 0)).toFixed(2);
      }

      setBalances(updated);
      setEurValues(eur);

      // sync su Supabase
      const upserts = SUPPORTED_NETWORKS.map((net) => ({
        email: user.email,
        network: net,
        wallet_address: publicKey,
        amount: updated[net],
        eur: eur[net],
        updated_at: new Date().toISOString(),
      }));

      await supabase.from("balances").upsert(upserts, {
        onConflict: ["email", "wallet_address", "network"],
      });
    } catch (err) {
      console.error("❌ Balances sync failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user, publicKey, getWalletBalance]);

  const send = async ({ to, amount, symbol, metadata = {} }) => {
    if (!privateKey) return { error: "Wallet not ready" };
    if (!ethers.utils.isAddress(to)) return { error: "Invalid address" };

    try {
      const provider = getProvider(symbol.toLowerCase());
      const signer = new ethers.Wallet(privateKey, provider);

      const amountInWei = ethers.utils.parseEther(amount);
      const fee = amountInWei.mul(3).div(100);
      const final = amountInWei.sub(fee);

      const tx1 = await signer.sendTransaction({ to, value: final });

      const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET;
      if (!adminWallet || !ethers.utils.isAddress(adminWallet)) {
        return { error: "Admin wallet misconfigured" };
      }

      const tx2 = await signer.sendTransaction({ to: adminWallet, value: fee });
      await Promise.all([tx1.wait(), tx2.wait()]);

      await supabase.from("transactions").insert({
        user_email: user.email,
        to_address: to,
        from_address: publicKey,
        amount,
        fee: ethers.utils.formatEther(fee),
        network: symbol.toLowerCase(),
        type: metadata?.type || "send",
        tx_hash: tx1.hash,
        created_at: new Date().toISOString(),
      });

      return { success: true, userTx: tx1.hash };
    } catch (err) {
      return { error: err.message };
    }
  };

  useEffect(() => {
    if (user?.email && publicKey) {
      refreshAllBalances();
    }
  }, [user, publicKey, refreshAllBalances]);

  return (
    <WalletContext.Provider
      value={{
        balances,
        eurValues,
        refreshAllBalances,
        getWalletBalance,
        send,
        loading,
        publicKey,
      }}
    >
      {!loading && children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
