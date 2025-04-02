"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import { supabase } from "@/utils/supabaseClient";
import { useMagicLink } from "./MagicLinkContext";
import { useWalletCheck } from "./WalletCheckContext";

const WalletContext = createContext();

const RPC_URLS = {
  bsc: ["https://bsc-dataseed.binance.org", "https://rpc.ankr.com/bsc"],
  tbnb: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
  eth: ["https://eth.llamarpc.com", "https://rpc.ankr.com/eth"],
  matic: ["https://polygon-rpc.com", "https://rpc.ankr.com/polygon"],
  avax: ["https://api.avax.network/ext/bc/C/rpc"],
};

export const WalletProvider = ({ children }) => {
  const { user } = useMagicLink();
  const { walletReady } = useWalletCheck();

  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState("0.00000");
  const [activeNetwork, setActiveNetwork] = useState("bsc");
  const [loadingWallet, setLoadingWallet] = useState(true);

  const getProvider = (network) => {
    const urls = RPC_URLS[network] || [];
    for (const url of urls) {
      try {
        return new ethers.providers.JsonRpcProvider(url);
      } catch (_) {}
    }
    return null;
  };

  const refreshWallet = useCallback(async () => {
    if (!user?.email || !walletReady) return;

    setLoadingWallet(true);

    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("email", user.email)
        .single();

      if (error || !data) throw new Error("❌ Wallet not found.");

      const decrypted = CryptoJS.AES.decrypt(
        data.encrypted_private_key,
        process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key"
      ).toString(CryptoJS.enc.Utf8);

      if (!decrypted || decrypted.length < 30) throw new Error("❌ Decryption failed.");

      const provider = getProvider(activeNetwork);
      const loadedWallet = new ethers.Wallet(decrypted, provider);

      setWallet(loadedWallet);

      const balanceRaw = await loadedWallet.getBalance();
      setBalance(ethers.utils.formatEther(balanceRaw));
    } catch (err) {
      console.error("❌ WalletContext error:", err.message);
      setWallet(null);
      setBalance("0.00000");
    } finally {
      setLoadingWallet(false);
    }
  }, [user, walletReady, activeNetwork]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  const changeNetwork = (net) => {
    if (RPC_URLS[net]) setActiveNetwork(net);
  };

  const sendCrypto = async (to, amountEth) => {
    if (!wallet) return { success: false, message: "Wallet not ready" };
    if (!ethers.utils.isAddress(to)) return { success: false, message: "Invalid address" };

    try {
      const total = ethers.utils.parseEther(amountEth);
      const fee = total.mul(3).div(100); // 3%
      const finalAmount = total.sub(fee);

      const tx1 = await wallet.sendTransaction({ to, value: finalAmount });
      const tx2 = await wallet.sendTransaction({
        to: process.env.NEXT_PUBLIC_ADMIN_WALLET,
        value: fee,
      });

      await Promise.all([tx1.wait(), tx2.wait()]);

      return {
        success: true,
        hash: tx1.hash,
        feeHash: tx2.hash,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        publicKey: wallet?.address || null,
        balance,
        activeNetwork,
        changeNetwork,
        sendCrypto,
        refreshWallet,
        loadingWallet,
      }}
    >
      {!loadingWallet && children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
