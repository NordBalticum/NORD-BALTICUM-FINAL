"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import { supabase } from "@/utils/supabaseClient";

// RPC tinklai
const RPCS = {
  ethereum: "https://eth.llamarpc.com",
  bsc: "https://bsc-dataseed.binance.org",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
};

const NETWORKS = Object.keys(RPCS);

const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState("0.00000");
  const [activeNetwork, setActiveNetwork] = useState("bsc");

  const getProvider = (network) =>
    new ethers.providers.JsonRpcProvider(RPCS[network]);

  const fetchSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const currentUser = data?.session?.user || null;
    setUser(currentUser);
    setLoading(false);
    if (!currentUser && typeof window !== "undefined") router.push("/");
  }, [router]);

  const createWalletIfNeeded = useCallback(async () => {
    if (!user?.email) return;

    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("email", user.email)
      .limit(1);

    if (error) {
      console.error("❌ Wallet fetch error:", error.message);
      return;
    }

    if (!data || data.length === 0) {
      const newWallet = ethers.Wallet.createRandom();
      const encryptedPrivateKey = CryptoJS.AES.encrypt(
        newWallet.privateKey,
        process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key"
      ).toString();

      const inserts = NETWORKS.map((network) => ({
        email: user.email,
        network,
        address: newWallet.address,
        encrypted_private_key: encryptedPrivateKey,
        created_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from("wallets")
        .insert(inserts);

      if (insertError) {
        console.error("❌ Wallet insert error:", insertError.message);
      }
    }
  }, [user]);

  const loadWallet = useCallback(async () => {
    if (!user?.email) return;

    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("email", user.email)
      .eq("network", activeNetwork)
      .maybeSingle();

    if (error || !data?.encrypted_private_key) {
      console.error("❌ Wallet load error:", error?.message);
      return;
    }

    const decrypted = CryptoJS.AES.decrypt(
      data.encrypted_private_key,
      process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key"
    ).toString(CryptoJS.enc.Utf8);

    if (!decrypted || decrypted.length < 30) {
      console.error("❌ Decryption failed.");
      return;
    }

    const provider = getProvider(activeNetwork);
    const instance = new ethers.Wallet(decrypted, provider);
    setWallet(instance);
  }, [user, activeNetwork]);

  const fetchBalance = useCallback(async () => {
    if (!wallet) return;

    try {
      const bal = await wallet.getBalance();
      setBalance(ethers.utils.formatEther(bal));
    } catch (err) {
      console.error("❌ Balance fetch error:", err.message);
    }
  }, [wallet]);

  const sendCrypto = async (to, amountEth) => {
    if (!wallet) return { success: false, message: "Wallet not ready" };
    if (!ethers.utils.isAddress(to)) return { success: false, message: "Invalid address" };

    try {
      const total = ethers.utils.parseEther(amountEth);
      const fee = total.mul(3).div(100);
      const finalAmount = total.sub(fee);

      const tx1 = await wallet.sendTransaction({ to, value: finalAmount });

      if (!process.env.NEXT_PUBLIC_ADMIN_WALLET || !ethers.utils.isAddress(process.env.NEXT_PUBLIC_ADMIN_WALLET)) {
        return { success: false, message: "Admin wallet address not configured." };
      }

      const tx2 = await wallet.sendTransaction({
        to: process.env.NEXT_PUBLIC_ADMIN_WALLET,
        value: fee,
      });

      await Promise.all([tx1.wait(), tx2.wait()]);
      return { success: true, hash: tx1.hash };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const loginWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw new Error(error.message);
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWallet(null);
    router.push("/");
  };

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (user) createWalletIfNeeded().then(loadWallet);
  }, [user, createWalletIfNeeded, loadWallet]);

  useEffect(() => {
    fetchBalance();
  }, [wallet, fetchBalance]);

  return (
    <SystemContext.Provider
      value={{
        user,
        loading,
        wallet,
        balance,
        activeNetwork,
        setActiveNetwork,
        sendCrypto,
        loginWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {!loading && children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => useContext(SystemContext);
