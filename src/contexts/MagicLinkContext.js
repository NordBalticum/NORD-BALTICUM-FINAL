"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";

const MagicLinkContext = createContext();
const ENCRYPTION_KEY = "NORD-BALTICUM-2025-SECRET";

export function MagicLinkProvider({ children }) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  // === Encryption utils ===
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

  // === LocalStorage ===
  const storePrivateKey = (pk) => {
    try {
      const encrypted = encrypt(pk);
      localStorage.setItem("nbc_private_key", encrypted);
    } catch (err) {
      console.error("❌ Failed to store key:", err.message);
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
    if (!pk) return null;
    try {
      return new ethers.Wallet(pk).address;
    } catch {
      return null;
    }
  };

  // === DB piniginės gavimas arba sukūrimas ===
  const getOrCreateWallet = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("address, private_key_encrypted")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.address && data?.private_key_encrypted) {
        const localPk = getPrivateKey();
        if (!localPk) {
          const decrypted = decrypt(data.private_key_encrypted);
          if (decrypted) storePrivateKey(decrypted);
        }
        return {
          address: data.address,
          list: [
            { network: "bnb", address: data.address },
            { network: "tbnb", address: data.address },
            { network: "eth", address: data.address },
            { network: "matic", address: data.address },
            { network: "avax", address: data.address },
          ],
        };
      }

      // Jei nerasta DB – generuoja
      const newWallet = ethers.Wallet.createRandom();
      const encryptedKey = encrypt(newWallet.privateKey);
      storePrivateKey(newWallet.privateKey);

      const { error: insertError } = await supabase.from("wallets").insert([
        {
          user_id: userId,
          address: newWallet.address,
          private_key_encrypted: encryptedKey,
          network: "multi",
        },
      ]);

      if (insertError) throw insertError;

      return {
        address: newWallet.address,
        list: [
          { network: "bnb", address: newWallet.address },
          { network: "tbnb", address: newWallet.address },
          { network: "eth", address: newWallet.address },
          { network: "matic", address: newWallet.address },
          { network: "avax", address: newWallet.address },
        ],
      };
    } catch (err) {
      console.error("❌ Wallet error:", err.message);
      return null;
    }
  }, []);

  // === Sesijos paleidimas ===
  const initSession = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        setUser(null);
        setWallet(null);
        return;
      }

      setUser(data.user);
      const walletData = await getOrCreateWallet(data.user.id);
      if (walletData?.address) setWallet(walletData);
    } catch (err) {
      console.error("❌ Session error:", err.message);
      setUser(null);
      setWallet(null);
    } finally {
      setLoading(false);
      setSessionChecked(true);
    }
  }, [getOrCreateWallet]);

  // === Auth + timeout listeneriai ===
  useEffect(() => {
    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const loggedUser = session?.user || null;
        setUser(loggedUser);

        if (loggedUser?.id) {
          const walletData = await getOrCreateWallet(loggedUser.id);
          if (walletData?.address) setWallet(walletData);
        } else {
          setWallet(null);
        }
      }
    );

    const interval = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          setUser(null);
          setWallet(null);
          localStorage.removeItem("nbc_private_key");
          router.push("/");
        }
      });
    }, 1000 * 60 * 10); // 10 min

    return () => {
      listener?.subscription?.unsubscribe();
      clearInterval(interval);
    };
  }, [initSession, getOrCreateWallet, router]);

  // === Auto redirect į dashboard jei prisijungęs ===
  useEffect(() => {
    if (!loading && sessionChecked && user && wallet?.address) {
      if (window.location.pathname === "/") {
        router.push("/dashboard");
      }
    }
  }, [loading, sessionChecked, user, wallet, router]);

  // === Login / Logout ===
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
    router.push("/");
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
