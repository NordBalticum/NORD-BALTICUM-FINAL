"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";

const MagicLinkContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publicKey, setPublicKey] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);

  const ENCRYPTION_KEY = "nordbalticum_super_safe_512bit"; // fallback key
  const SUPPORTED_NETWORKS = ["bsc", "tbnb", "eth", "polygon", "avax"];

  const fetchSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data?.session?.user || null;
    setUser(sessionUser);
    setLoading(false);
    if (!sessionUser && typeof window !== "undefined") {
      router.replace("/");
    }
  }, [router]);

  const ensureWallet = useCallback(async (email) => {
    const { data } = await supabase
      .from("wallets")
      .select("encrypted_private_key")
      .eq("email", email)
      .limit(1);

    if (data?.length > 0) {
      const decrypted = CryptoJS.AES.decrypt(
        data[0].encrypted_private_key,
        ENCRYPTION_KEY
      ).toString(CryptoJS.enc.Utf8);

      if (!decrypted || decrypted.length < 30) return;

      setPrivateKey(decrypted);
      setPublicKey(new ethers.Wallet(decrypted).address);
      return;
    }

    const newWallet = ethers.Wallet.createRandom();
    const encrypted = CryptoJS.AES.encrypt(
      newWallet.privateKey,
      ENCRYPTION_KEY
    ).toString();

    const inserts = SUPPORTED_NETWORKS.map((network) => ({
      email,
      network,
      address: newWallet.address,
      encrypted_private_key: encrypted,
      created_at: new Date().toISOString(),
    }));

    await supabase.from("wallets").insert(inserts);
    setPrivateKey(newWallet.privateKey);
    setPublicKey(newWallet.address);
  }, []);

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
    setPrivateKey(null);
    setPublicKey(null);
    router.replace("/");
  };

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (user?.email) ensureWallet(user.email);
  }, [user, ensureWallet]);

  return (
    <MagicLinkContext.Provider
      value={{
        user,
        loading,
        publicKey,
        privateKey,
        loginWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {!loading && children}
    </MagicLinkContext.Provider>
  );
};

export const useMagicLink = () => useContext(MagicLinkContext);
