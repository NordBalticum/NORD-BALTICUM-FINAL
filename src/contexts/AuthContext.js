"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";

// ✅ RPC
export const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

// ✅ Encryption
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async () => {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encode(ENCRYPTION_SECRET),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encrypt = async (text) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encode(text)
  );
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
};

export const decrypt = async (ciphertext) => {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey();
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return decode(decrypted);
};

export const isValidPrivateKey = (key) => /^0x[a-fA-F0-9]{64}$/.test(key);

// ✅ Context
export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const isClient = typeof window !== "undefined";

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);

  const inactivityTimer = useRef(null);
  const lastSessionRefresh = useRef(Date.now());

  useEffect(() => {
    if (!isClient) return;
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          setUser(session.user);
        } else {
          setSession(null);
          setUser(null);
          setWallet(null);
        }
      } catch (err) {
        console.error("Session load failed:", err.message);
        setSession(null);
        setUser(null);
        setWallet(null);
      } finally {
        setAuthLoading(false);
      }
    };
    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        toast.error("⚠️ Session ended. Redirecting...");
        signOut(false);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isClient || authLoading || !user?.email) return;
    loadOrCreateWallet(user.email);
  }, [authLoading, user]);

  const loadOrCreateWallet = async (email) => {
    try {
      setWalletLoading(true);
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_email", email)
        .maybeSingle();
      if (error) throw error;
      if (data?.encrypted_key) {
        const decryptedKey = await decrypt(data.encrypted_key);
        setupWallet(decryptedKey);
      } else {
        await createAndStoreWallet(email);
      }
    } catch (err) {
      console.error("Wallet load failed:", err.message);
      toast.error("❌ Wallet load failed.");
      setWallet(null);
    } finally {
      setWalletLoading(false);
    }
  };

  const createAndStoreWallet = async (email) => {
    const newWallet = ethers.Wallet.createRandom();
    const encryptedKey = await encrypt(newWallet.privateKey);
    const { error } = await supabase.from("wallets").upsert({
      user_email: email,
      eth_address: newWallet.address,
      encrypted_key: encryptedKey,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    setupWallet(newWallet.privateKey);
    toast.success("✅ Wallet created!");
  };

  const importWalletFromPrivateKey = async (email, privateKey) => {
    if (!isValidPrivateKey(privateKey)) {
      toast.error("❌ Invalid private key format.");
      return;
    }
    try {
      setWalletLoading(true);
      const existing = await supabase.from("wallets").select("eth_address").eq("user_email", email).single();
      const newAddress = new ethers.Wallet(privateKey).address;
      if (existing.data?.eth_address === newAddress) {
        toast.info("⚠️ Same wallet already imported.");
        return setupWallet(privateKey);
      }
      const encryptedKey = await encrypt(privateKey);
      const { error } = await supabase.from("wallets").upsert({
        user_email: email,
        eth_address: newAddress,
        encrypted_key: encryptedKey,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setupWallet(privateKey);
      toast.success("✅ Wallet imported!");
    } catch (err) {
      console.error("Wallet import failed:", err.message);
      toast.error("❌ Wallet import failed.");
    } finally {
      setWalletLoading(false);
    }
  };

  const setupWallet = (privateKey) => {
    const baseWallet = new ethers.Wallet(privateKey);
    const signers = {};
    Object.entries(RPC).forEach(([net, url]) => {
      const provider = new ethers.JsonRpcProvider(url);
      signers[net] = new ethers.Wallet(privateKey, provider);
    });
    setWallet({ wallet: baseWallet, signers });
  };

  const safeRefreshSession = async () => {
    if (Date.now() - lastSessionRefresh.current < 60000) return null;
    lastSessionRefresh.current = Date.now();
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session) {
        setSession(session);
        setUser(session.user);
      } else {
        setSession(null);
        setUser(null);
        setWallet(null);
      }
      return session ?? null;
    } catch (err) {
      console.error("Session refresh failed:", err.message);
      setSession(null);
      setUser(null);
      setWallet(null);
      return null;
    }
  };

  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(() => safeRefreshSession(), 300000);
    return () => clearInterval(interval);
  }, [safeRefreshSession, isClient]);

  useEffect(() => {
    if (!isClient) return;
    const handleVisible = debounce(() => safeRefreshSession(), 500);
    const handleOnline = debounce(() => safeRefreshSession(), 500);
    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("online", handleOnline);
    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("online", handleOnline);
      handleVisible.cancel?.();
      handleOnline.cancel?.();
    };
  }, [safeRefreshSession, isClient]);

  useEffect(() => {
    if (!isClient) return;
    const resetTimer = () => {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        toast.error("⏳ Inactivity logout.");
        signOut(true);
      }, 10 * 60 * 1000);
    };
    ["mousemove", "keydown", "touchstart", "touchmove"].forEach((event) =>
      window.addEventListener(event, resetTimer)
    );
    resetTimer();
    return () => {
      clearTimeout(inactivityTimer.current);
      ["mousemove", "keydown", "touchstart", "touchmove"].forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, []);

  const signInWithMagicLink = async (email) => {
    const origin = isClient ? window.location.origin : "https://nordbalticum.com";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/dashboard`,
      },
    });
    if (error) {
      toast.error("❌ Magic link error.");
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    const origin = isClient ? window.location.origin : "https://nordbalticum.com";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/dashboard` },
    });
    if (error) {
      toast.error("❌ Google login error.");
      throw error;
    }
  };

  const signOut = async (showToast = false, redirectPath = "/") => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err.message);
    }
    try { setUser(null); } catch {}
    try { setWallet(null); } catch {}
    try { setSession(null); } catch {}
    if (isClient) {
      ["userPrivateKey", "activeNetwork", "sessionData"].forEach((key) =>
        localStorage.removeItem(key)
      );
    }
    router.replace(redirectPath);
    if (showToast) {
      toast.info("👋 Logged out.", { position: "top-center", autoClose: 4000 });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        wallet,
        authLoading,
        walletLoading,
        safeRefreshSession,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
        importWalletFromPrivateKey,
        isValidPrivateKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
