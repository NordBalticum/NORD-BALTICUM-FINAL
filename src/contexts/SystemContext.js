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

// === Supported Networks ===
const SUPPORTED_NETWORKS = ["bsc", "tbnb", "ethereum", "polygon", "avalanche"];

const RPCS = {
  ethereum: "https://eth.llamarpc.com",
  bsc: "https://bsc-dataseed.binance.org",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
  polygon: "https://polygon-rpc.com",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
};

const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState("0.00000");
  const [totalEUR, setTotalEUR] = useState("0.00");
  const [activeNetwork, setActiveNetwork] = useState("bsc");

  const getProvider = (network) =>
    new ethers.providers.JsonRpcProvider(RPCS[network]);

  const isValidAddress = (address) => {
    try {
      return ethers.utils.isAddress(address);
    } catch {
      return false;
    }
  };

  const fetchSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const currentUser = data?.session?.user || null;
    setUser(currentUser);
    setLoading(false);
    if (!currentUser && typeof window !== "undefined") router.push("/");
  }, [router]);

  const createWalletIfNeeded = useCallback(async () => {
    if (!user?.email) return;

    const { data } = await supabase
      .from("wallets")
      .select("encrypted_private_key")
      .eq("email", user.email)
      .limit(1);

    if (!data || data.length === 0) {
      const newWallet = ethers.Wallet.createRandom();
      const encryptedPrivateKey = CryptoJS.AES.encrypt(
        newWallet.privateKey,
        process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key"
      ).toString();

      const inserts = SUPPORTED_NETWORKS.map((network) => ({
        email: user.email,
        network,
        address: newWallet.address,
        encrypted_private_key: encryptedPrivateKey,
        created_at: new Date().toISOString(),
      }));

      await supabase.from("wallets").insert(inserts);
    }
  }, [user]);

  const loadWallet = useCallback(async () => {
    if (!user?.email) return;

    const { data } = await supabase
      .from("wallets")
      .select("encrypted_private_key")
      .eq("email", user.email)
      .eq("network", activeNetwork)
      .maybeSingle();

    if (!data?.encrypted_private_key) return;

    const decrypted = CryptoJS.AES.decrypt(
      data.encrypted_private_key,
      process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default_key"
    ).toString(CryptoJS.enc.Utf8);

    if (!decrypted || decrypted.length < 30) return;

    const provider = getProvider(activeNetwork);
    const signer = new ethers.Wallet(decrypted, provider);
    setWallet(signer);
  }, [user, activeNetwork]);

  const fetchBalance = useCallback(async () => {
    if (!wallet) return;

    try {
      const bal = await wallet.getBalance();
      const formatted = parseFloat(ethers.utils.formatEther(bal)).toFixed(5);
      setBalance(formatted);
    } catch (err) {
      console.error("❌ Balance fetch error:", err.message);
    }
  }, [wallet]);

  const refreshAllBalances = useCallback(async () => {
    if (!user?.email || !wallet?.address) return;

    try {
      const pricesRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,binancecoin,polygon,avalanche-2&vs_currencies=eur"
      );
      const prices = await pricesRes.json();

      const networkToId = {
        bsc: "binancecoin",
        tbnb: "binancecoin",
        ethereum: "ethereum",
        polygon: "polygon",
        avalanche: "avalanche-2",
      };

      const results = [];

      await Promise.all(
        SUPPORTED_NETWORKS.map(async (network) => {
          try {
            const provider = getProvider(network);
            const raw = await provider.getBalance(wallet.address);
            const formatted = parseFloat(ethers.utils.formatEther(raw)).toFixed(5);
            const eur = (
              parseFloat(formatted) *
              (prices[networkToId[network]]?.eur || 0)
            ).toFixed(2);

            results.push({
              email: user.email,
              network,
              wallet_address: wallet.address,
              amount: formatted,
              eur,
              updated_at: new Date().toISOString(),
            });
          } catch (err) {
            console.warn(`❌ [${network}] balance fetch failed:`, err.message);
          }
        })
      );

      if (results.length > 0) {
        await supabase.from("balances").upsert(results, {
          onConflict: ["email", "wallet_address", "network"],
        });

        const total = results.reduce(
          (sum, b) => sum + parseFloat(b.eur || 0),
          0
        );
        setTotalEUR(total.toFixed(2));
      }
    } catch (err) {
      console.error("❌ Total EUR sync failed:", err.message);
    }
  }, [user, wallet]);

  const sendCrypto = async (to, amountEth) => {
    if (!wallet) return { success: false, message: "Wallet not ready" };
    if (!isValidAddress(to)) return { success: false, message: "Invalid address" };

    try {
      const total = ethers.utils.parseEther(amountEth);
      const fee = total.mul(3).div(100);
      const finalAmount = total.sub(fee);

      const tx1 = await wallet.sendTransaction({ to, value: finalAmount });

      const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET;
      if (!adminWallet || !isValidAddress(adminWallet)) {
        return { success: false, message: "Admin wallet address not configured." };
      }

      const tx2 = await wallet.sendTransaction({
        to: adminWallet,
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
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
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

  useEffect(() => {
    if (wallet && user?.email) {
      refreshAllBalances();
      const interval = setInterval(refreshAllBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [wallet, user, refreshAllBalances]);

  return (
    <SystemContext.Provider
      value={{
        user,
        loading,
        wallet,
        balance,
        totalEUR,
        activeNetwork,
        setActiveNetwork,
        sendCrypto,
        loginWithEmail,
        loginWithGoogle,
        logout,
        refreshAllBalances,
      }}
    >
      {!loading && children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => useContext(SystemContext);
