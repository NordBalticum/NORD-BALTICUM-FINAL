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
  // Ethereum Mainnet
  eth: {
    urls: [
      "https://ethereum.publicnode.com",
      "https://rpc.ankr.com/eth",
      "https://cloudflare-eth.com",
    ],
    chainId: 1,
    name: "eth",
  },
  // Ethereum Sepolia
  sepolia: {
    urls: [
      "https://rpc.sepolia.org",
      "https://rpc.ankr.com/eth_sepolia",
      "https://sepolia.publicnode.com",
    ],
    chainId: 11155111,
    name: "sepolia",
  },

  // Polygon Mainnet
  matic: {
    urls: [
      "https://polygon-rpc.com",
      "https://rpc.ankr.com/polygon",
      "https://polygon-bor.publicnode.com",
    ],
    chainId: 137,
    name: "matic",
  },
  // Polygon Mumbai
  mumbai: {
    urls: [
      "https://matic-mumbai.chainstacklabs.com",
      "https://rpc.ankr.com/polygon_mumbai",
      "https://rpc-mumbai.maticvigil.com",
    ],
    chainId: 80001,
    name: "mumbai",
  },

  // BNB Chain Mainnet
  bnb: {
    urls: [
      "https://bsc-dataseed.binance.org/",
      "https://rpc.ankr.com/bsc",
      "https://bsc.publicnode.com",
    ],
    chainId: 56,
    name: "bnb",
  },
  // BNB Chain Testnet
  tbnb: {
    urls: [
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
      "https://rpc.ankr.com/bsc_testnet",
      "https://bsc-testnet.publicnode.com",
    ],
    chainId: 97,
    name: "tbnb",
  },

  // Avalanche C-Chain Mainnet
  avax: {
    urls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://rpc.ankr.com/avalanche",
      "https://avalanche.publicnode.com",
    ],
    chainId: 43114,
    name: "avax",
  },
  // Avalanche Fuji Testnet
  fuji: {
    urls: [
      "https://api.avax-test.network/ext/bc/C/rpc",
      "https://rpc.ankr.com/avalanche_fuji",
      "https://avalanche-fuji.publicnode.com",
    ],
    chainId: 43113,
    name: "fuji",
  },

  // Optimism Mainnet
  optimism: {
    urls: [
      "https://mainnet.optimism.io",
      "https://rpc.ankr.com/optimism",
      "https://optimism.publicnode.com",
    ],
    chainId: 10,
    name: "optimism",
  },
  // Optimism Goerli
  optimismgoerli: {
    urls: [
      "https://goerli.optimism.io",
      "https://rpc.ankr.com/optimism_goerli",
      "https://optimism-goerli.publicnode.com",
    ],
    chainId: 420,
    name: "optimismgoerli",
  },

  // Arbitrum One
  arbitrum: {
    urls: [
      "https://arb1.arbitrum.io/rpc",
      "https://rpc.ankr.com/arbitrum",
      "https://arbitrum.publicnode.com",
    ],
    chainId: 42161,
    name: "arbitrum",
  },
  // Arbitrum Goerli
  arbitrumgoerli: {
    urls: [
      "https://goerli-rollup.arbitrum.io/rpc",
      "https://rpc.ankr.com/arbitrum_goerli",
      "https://arbitrum-goerli.publicnode.com",
    ],
    chainId: 421613,
    name: "arbitrumgoerli",
  },

  // Base Mainnet
  base: {
    urls: [
      "https://base-mainnet.public.blastapi.io",
      "https://rpc.ankr.com/base",
      "https://base.publicnode.com",
    ],
    chainId: 8453,
    name: "base",
  },
  // Base Goerli
  basegoerli: {
    urls: [
      "https://goerli.base.org",
      "https://rpc.ankr.com/base_goerli",
      "https://base-goerli.publicnode.com",
    ],
    chainId: 84531,
    name: "basegoerli",
  },

  // zkSync Era Mainnet
  zksync: {
    urls: [
      "https://mainnet.era.zksync.io",
      "https://rpc.ankr.com/zksync",
      "https://zksync.publicnode.com",
    ],
    chainId: 324,
    name: "zksync",
  },
  // zkSync Era Testnet
  zksynctest: {
    urls: [
      "https://testnet.era.zksync.dev",
      "https://rpc.ankr.com/zksync_testnet",
      "https://zksync-testnet.publicnode.com",
    ],
    chainId: 280,
    name: "zksynctest",
  },

  // Linea Mainnet
  linea: {
    urls: [
      "https://rpc.linea.build",
      "https://rpc.ankr.com/linea",
      "https://linea.publicnode.com",
    ],
    chainId: 59144,
    name: "linea",
  },
  // Linea Testnet
  lineatest: {
    urls: [
      "https://rpc.goerli.linea.build",
      "https://rpc.ankr.com/linea_goerli",
      "https://linea-goerli.publicnode.com",
    ],
    chainId: 59140,
    name: "lineatest",
  },

  // Scroll Mainnet
  scroll: {
    urls: [
      "https://scroll.io/l2",
      "https://rpc.ankr.com/scroll",
      "https://scroll.publicnode.com",
    ],
    chainId: 534352,
    name: "scroll",
  },
  // Scroll Testnet
  scrolltest: {
    urls: [
      "https://scroll-testnet.public.blastapi.io",
      "https://rpc.ankr.com/scroll_testnet",
      "https://scroll-testnet.publicnode.com",
    ],
    chainId: 534353,
    name: "scrolltest",
  },

  // Mantle Mainnet
  mantle: {
    urls: [
      "https://rpc.mantle.xyz",
      "https://rpc.ankr.com/mantle",
      "https://mantle.publicnode.com",
    ],
    chainId: 5000,
    name: "mantle",
  },
  // Mantle Testnet
  mantletest: {
    urls: [
      "https://rpc.testnet.mantle.xyz",
      "https://rpc.ankr.com/mantle_testnet",
      "https://mantle-testnet.publicnode.com",
    ],
    chainId: 5001,
    name: "mantletest",
  },

  // Celo Mainnet
  celo: {
    urls: [
      "https://forno.celo.org",
      "https://rpc.ankr.com/celo",
      "https://celo.publicnode.com",
    ],
    chainId: 42220,
    name: "celo",
  },
  // Celo Alfajores
  alfajores: {
    urls: [
      "https://alfajores-forno.celo-testnet.org",
      "https://rpc.ankr.com/celo_alfajores",
      "https://alfajores.publicnode.com",
    ],
    chainId: 44787,
    name: "alfajores",
  },

  // Gnosis Chain Mainnet (xDAI)
  gnosis: {
    urls: [
      "https://rpc.gnosischain.com",
      "https://rpc.ankr.com/xdai",
      "https://gnosis.publicnode.com",
    ],
    chainId: 100,
    name: "gnosis",
  },
  // Gnosis Chiado Testnet
  chiado: {
    urls: [
      "https://rpc.chiadochain.net",
      "https://rpc.ankr.com/gnosis_chiado",
      "https://chiado.publicnode.com",
    ],
    chainId: 10200,
    name: "chiado",
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
