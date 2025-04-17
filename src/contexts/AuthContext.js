// src/contexts/AuthContext.js
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";

// ========================
// 🛠️ CONFIG & UTILITIES
// ========================

/**
 * RPC configurations with fallbacks for each supported network.
 */
export const RPC = {
  eth: {
    urls: ["https://ethereum.publicnode.com", "https://eth.llamarpc.com"],
    chainId: 1,
    name: "eth",
  },
  bnb: {
    urls: ["https://bsc-dataseed.binance.org/", "https://bsc.publicnode.com"],
    chainId: 56,
    name: "bnb",
  },
  tbnb: {
    urls: [
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
      "https://bsc-testnet.public.blastapi.io",
    ],
    chainId: 97,
    name: "tbnb",
  },
  matic: {
    urls: ["https://polygon-bor.publicnode.com", "https://1rpc.io/matic"],
    chainId: 137,
    name: "matic",
  },
  avax: {
    urls: [
      "https://avalanche-c-chain.publicnode.com",
      "https://avalanche.drpc.org",
    ],
    chainId: 43114,
    name: "avax",
  },
};

/**
 * Encryption secret must be defined in env: NEXT_PUBLIC_ENCRYPTION_SECRET
 */
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
if (!ENCRYPTION_SECRET) {
  console.error("Missing NEXT_PUBLIC_ENCRYPTION_SECRET");
}

const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

/**
 * Derive AES-GCM key using PBKDF2
 */
const getKey = async () => {
  const baseKey = await window.crypto.subtle.importKey(
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
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

/**
 * Encrypt text using AES-GCM
 */
export const encrypt = async (text) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();
  const data = encode(text);
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return btoa(
    JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
    })
  );
};

/**
 * Decrypt ciphertext
 */
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

/**
 * Validate Ethereum private key
 */
export const isValidPrivateKey = (key) =>
  /^0x[a-fA-F0-9]{64}$/.test(key.trim());

// ========================
// 📦 CONTEXT SETUP
// ========================

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const isClient = typeof window !== "undefined";

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);

  const lastSessionRefresh = useRef(Date.now());
  const inactivityTimer = useRef(null);

  /**
   * Setup wallet instance and per-network signers
   */
  const setupWallet = useCallback((privateKey) => {
    const base = new ethers.Wallet(privateKey);
    const signers = {};
    Object.entries(RPC).forEach(([net, cfg]) => {
      const provider = new ethers.FallbackProvider(
        cfg.urls.map((url) =>
          new ethers.JsonRpcProvider(url, { chainId: cfg.chainId, name: cfg.name })
        )
      );
      signers[net] = new ethers.Wallet(privateKey, provider);
    });
    setWallet({ wallet: base, signers });
  }, []);

  /**
   * Create new wallet and store encrypted key
   */
  const createAndStoreWallet = useCallback(
    async (email) => {
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
      toast.success("✅ Wallet created!", { position: "top-center", autoClose: 3000 });
    },
    [setupWallet]
  );

  /**
   * Load existing or create new wallet
   */
  const loadOrCreateWallet = useCallback(
    async (email) => {
      try {
        setWalletLoading(true);
        const { data, error } = await supabase
          .from("wallets")
          .select("encrypted_key")
          .eq("user_email", email)
          .maybeSingle();
        if (error) throw error;
        if (data?.encrypted_key) {
          const pk = await decrypt(data.encrypted_key);
          setupWallet(pk);
        } else {
          await createAndStoreWallet(email);
        }
      } catch (err) {
        console.error("Wallet load/create error:", err);
        toast.error("❌ Wallet load failed", { position: "top-center", autoClose: 3000 });
        setWallet(null);
      } finally {
        setWalletLoading(false);
      }
    },
    [createAndStoreWallet, setupWallet]
  );

  /**
   * Import wallet from private key string
   */
  const importWalletFromPrivateKey = useCallback(
    async (email, privateKey) => {
      if (!isValidPrivateKey(privateKey)) {
        toast.error("❌ Invalid private key format", { position: "top-center", autoClose: 3000 });
        return;
      }
      try {
        setWalletLoading(true);
        const address = new ethers.Wallet(privateKey).address;
        const encryptedKey = await encrypt(privateKey);
        const { error } = await supabase.from("wallets").upsert({
          user_email: email,
          eth_address: address,
          encrypted_key: encryptedKey,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        setupWallet(privateKey);
        toast.success("✅ Wallet imported!", { position: "top-center", autoClose: 3000 });
      } catch (err) {
        console.error("Import failed:", err);
        toast.error("❌ Wallet import failed", { position: "top-center", autoClose: 3000 });
      } finally {
        setWalletLoading(false);
      }
    },
    [setupWallet]
  );

  /**
   * Refresh Supabase session & optionally schedule next
   */
  const safeRefreshSession = useCallback(async () => {
    if (Date.now() - lastSessionRefresh.current < 60_000) return;
    lastSessionRefresh.current = Date.now();
    try {
      const {
        data: { session: newSession },
      } = await supabase.auth.refreshSession();
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
      } else {
        setSession(null);
        setUser(null);
        setWallet(null);
      }
    } catch (err) {
      console.error("Session refresh error:", err);
      setSession(null);
      setUser(null);
      setWallet(null);
    }
  }, []);

  /**
   * Sign in flows
   */
  const signInWithMagicLink = useCallback(
    async (email) => {
      const redirectTo = (isClient ? window.location.origin : "https://nordbalticum.com") + "/dashboard";
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
      });
      if (error) {
        toast.error("❌ Magic link error", { position: "top-center", autoClose: 3000 });
        throw error;
      }
    },
    [isClient]
  );

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = (isClient ? window.location.origin : "https://nordbalticum.com") + "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      toast.error("❌ Google login error", { position: "top-center", autoClose: 3000 });
      throw error;
    }
  }, [isClient]);

  /**
   * Sign out (Supabase + clear state)
   */
  const signOut = useCallback(
    async (showToast = false, redirectPath = "/") => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error:", err);
      }
      setUser(null);
      setSession(null);
      setWallet(null);
      if (isClient) {
        ["userPrivateKey", "activeNetwork", "sessionData"].forEach((k) => localStorage.removeItem(k));
      }
      router.replace(redirectPath);
      if (showToast) {
        toast.info("👋 Logged out", { position: "top-center", autoClose: 3000 });
      }
    },
    [router, isClient]
  );

  // ========================
  // 🔌 SIDE EFFECTS
  // ========================

  // Initialize session & auth state
  useEffect(() => {
    if (!isClient) return;
    (async () => {
      try {
        const { data: { session: initSession } } = await supabase.auth.getSession();
        if (initSession) {
          setSession(initSession);
          setUser(initSession.user);
        }
      } catch (err) {
        console.error("Initial session load error:", err);
      } finally {
        setAuthLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, newSession) => {
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
      } else {
        setSession(null);
        setUser(null);
        setWallet(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [isClient]);

  // Load or create wallet when authenticated
  useEffect(() => {
    if (!isClient || authLoading || !user?.email) return;
    loadOrCreateWallet(user.email);
  }, [authLoading, user?.email, isClient, loadOrCreateWallet]);

  // Auto-refresh session on focus/visibility
  useEffect(() => {
    if (!isClient) return;
    const onFocus = debounce(() => safeRefreshSession(), 300);
    const onVisible = debounce(() => {
      if (document.visibilityState === "visible") safeRefreshSession();
    }, 300);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      onFocus.cancel();
      onVisible.cancel();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [safeRefreshSession, isClient]);

  // Inactivity logout (15 min)
  useEffect(() => {
    if (!isClient) return;
    const events = ["mousemove", "keydown", "click", "touchstart"];
    const resetTimer = () => {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => signOut(true), 15 * 60 * 1000);
    };
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer();
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [signOut, isClient]);

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
      {!authLoading && children}
    </AuthContext.Provider>
  );
};
