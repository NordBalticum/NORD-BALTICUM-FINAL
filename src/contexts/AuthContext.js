"use client";

// 1️⃣ IMPORTAI
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { startSessionWatcher } from "@/utils/sessionWatcher"; // ✅ (jei neveikia, pasakyk, atnaujinsim)

// 2️⃣ RPC TINKLAI
export const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

// 3️⃣ ENV VARIABLES
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

// 4️⃣ ENCRYPT/DECRYPT UTILS
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

// 5️⃣ CONTEXT SETUP
export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// 6️⃣ AUTH PROVIDER
export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isClient = typeof window !== "undefined";

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);

  const sessionWatcher = useRef(null);
  const inactivityTimer = useRef(null);
  const lastSessionRefresh = useRef(Date.now());

  // 7️⃣ SESSION INIT (getSession)
  useEffect(() => {
    if (!isClient) return;

    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Session load error:", error.message);
      } finally {
        setAuthLoading(false);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session) {
        toast.error("⚠️ Session ended. Redirecting...");
        setTimeout(() => signOut(false), 3000);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  // 8️⃣ WALLET INIT jei yra user
  useEffect(() => {
    if (!isClient || authLoading || !user?.email) return;
    loadOrCreateWallet(user.email);
  }, [authLoading, user]);

  // 9️⃣ SESSION WATCHER START
  useEffect(() => {
    if (!isClient) return;
    if (user) {
      try {
        sessionWatcher.current = startSessionWatcher({
          onSessionInvalid: async () => {
            toast.error("❌ Session expired. Re-login.");
            setTimeout(() => signOut(false), 3000);
          },
          intervalMinutes: 1,
        });
        sessionWatcher.current?.start?.();
      } catch (error) {
        console.error("SessionWatcher error:", error.message);
      }
    } else {
      sessionWatcher.current?.stop?.();
    }
    return () => {
      sessionWatcher.current?.stop?.();
    };
  }, [user]);

  // 🔟 AUTO SESSION REFRESH kas 5 minutes
  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(() => {
      safeRefreshSession();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const safeRefreshSession = async () => {
    if (Date.now() - lastSessionRefresh.current < 60000) return;
    lastSessionRefresh.current = Date.now();
    try {
      await supabase.auth.refreshSession();
    } catch (error) {
      console.error("Session refresh failed:", error.message);
    }
  };

  // 1️⃣1️⃣ AUTO LOGOUT po 10min
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

  // 1️⃣2️⃣ LOAD or CREATE WALLET
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
    } catch (error) {
      console.error("Wallet load error:", error.message);
      toast.error("❌ Wallet load failed.");
      setWallet(null);
    } finally {
      setWalletLoading(false);
    }
  };

  // 1️⃣3️⃣ CREATE WALLET + SAVE
  const createAndStoreWallet = async (email) => {
    const newWallet = ethers.Wallet.createRandom();
    const encryptedKey = await encrypt(newWallet.privateKey);

    const { error } = await supabase.from("wallets").insert({
      user_email: email,
      eth_address: newWallet.address,
      encrypted_key: encryptedKey,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    setupWallet(newWallet.privateKey);
    toast.success("✅ Wallet created!");
  };

  // 1️⃣4️⃣ SETUP WALLET (MetaMask lygio)
  const setupWallet = (privateKey) => {
    const baseWallet = new ethers.Wallet(privateKey);
    const signers = {};

    Object.entries(RPC).forEach(([net, url]) => {
      const provider = new ethers.JsonRpcProvider(url);
      const signer = new ethers.Wallet(privateKey, provider);
      signers[net] = signer;
    });

    setWallet({ wallet: baseWallet, signers });
  };

  // 1️⃣5️⃣ SIGN IN MAGIC LINK
  const signInWithMagicLink = async (email) => {
    const origin = isClient ? window.location.origin : "https://nordbalticum.com";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${origin}/dashboard` },
    });
    if (error) {
      console.error(error.message);
      toast.error("❌ Magic link error.");
      throw error;
    }
  };

  // 1️⃣6️⃣ SIGN IN GOOGLE
  const signInWithGoogle = async () => {
    const origin = isClient ? window.location.origin : "https://nordbalticum.com";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/dashboard` },
    });
    if (error) {
      console.error(error.message);
      toast.error("❌ Google login error.");
      throw error;
    }
  };

  // 1️⃣7️⃣ SIGN OUT
  const signOut = async (showToast = false) => {
    await supabase.auth.signOut();
    setUser(null);
    setWallet(null);
    sessionWatcher.current?.stop?.();
    if (isClient) {
      ["userPrivateKey", "activeNetwork", "sessionData"].forEach((key) => {
        localStorage.removeItem(key);
      });
    }
    router.replace("/");
    if (showToast) {
      toast.info("👋 Logged out.", { position: "top-center", autoClose: 4000 });
    }
  };

  // 1️⃣8️⃣ FINAL CONTEXT
  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        authLoading,
        walletLoading,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
