"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";
import { ethers } from "ethers";

const MagicLinkContext = createContext();
const ENCRYPTION_KEY = "NORD-BALTICUM-2025-SECRET";

export function MagicLinkProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  const encrypt = (text) =>
    CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();

  const decrypt = (cipher) => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  };

  const storePrivateKey = (pk) => {
    try {
      const encrypted = encrypt(pk);
      localStorage.setItem("nbc_private_key", encrypted);
    } catch (err) {
      console.error("❌ Store PK error:", err.message);
    }
  };

  const getPrivateKey = () => {
    try {
      const cipher = localStorage.getItem("nbc_private_key");
      return cipher ? decrypt(cipher) : null;
    } catch {
      return null;
    }
  };

  const getWalletAddress = () => {
    const pk = getPrivateKey();
    try {
      return pk ? new ethers.Wallet(pk).address : null;
    } catch {
      return null;
    }
  };

  const getOrCreateWallet = useCallback(async (email) => {
    if (!email) return null;

    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("address, private_key_encrypted")
        .eq("email", email)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.address && data?.private_key_encrypted) {
        if (!getPrivateKey()) {
          const decrypted = decrypt(data.private_key_encrypted);
          if (decrypted) storePrivateKey(decrypted);
        }

        return {
          address: data.address,
          list: ["bnb", "tbnb", "eth", "matic", "avax"].map((net) => ({
            network: net,
            address: data.address,
          })),
        };
      }

      const newWallet = ethers.Wallet.createRandom();
      const encryptedKey = encrypt(newWallet.privateKey);
      storePrivateKey(newWallet.privateKey);

      const { error: insertError } = await supabase.from("wallets").insert([
        {
          email,
          address: newWallet.address,
          private_key_encrypted: encryptedKey,
          network: "multi",
        },
      ]);

      if (insertError) throw insertError;

      return {
        address: newWallet.address,
        list: ["bnb", "tbnb", "eth", "matic", "avax"].map((net) => ({
          network: net,
          address: newWallet.address,
        })),
      };
    } catch (err) {
      console.error("❌ Wallet error:", err.message);
      return null;
    }
  }, []);

  const initSession = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;

      if (!currentUser?.email) {
        setUser(null);
        setWallet(null);
        return;
      }

      setUser(currentUser);
      const walletData = await getOrCreateWallet(currentUser.email);
      if (walletData) setWallet(walletData);
    } catch (err) {
      console.error("❌ Session error:", err.message);
      setUser(null);
      setWallet(null);
    } finally {
      setLoading(false);
      setSessionChecked(true);
    }
  }, [getOrCreateWallet]);

  useEffect(() => {
    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;

        if (currentUser?.email) {
          setUser(currentUser);
          const walletData = await getOrCreateWallet(currentUser.email);
          if (walletData) setWallet(walletData);
        } else {
          setUser(null);
          setWallet(null);
          localStorage.removeItem("nbc_private_key");
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [initSession, getOrCreateWallet]);

  useEffect(() => {
    if (!loading && sessionChecked && user?.email && wallet?.address) {
      if (window.location.pathname === "/") {
        router.replace("/dashboard");
      }
    }
  }, [loading, sessionChecked, user, wallet, router]);

  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw new Error("Magic Link error: " + error.message);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw new Error("Google login error: " + error.message);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("Logout error: " + error.message);
    setUser(null);
    setWallet(null);
    localStorage.removeItem("nbc_private_key");
    router.replace("/");
  };

  return (
    <MagicLinkContext.Provider
      value={{
        user,
        wallet,
        loadingUser: loading || !sessionChecked,
        signInWithEmail,
        signInWithGoogle,
        signOut,
        getPrivateKey,
        getWalletAddress,
      }}
    >
      {children}
    </MagicLinkContext.Provider>
  );
}

export const useMagicLink = () => useContext(MagicLinkContext);
