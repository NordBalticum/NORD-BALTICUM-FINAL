"use client";

// 1. Importai
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { startSessionWatcher } from "@/utils/sessionWatcher";

// 2. RPC URL'ai
const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

// 3. ENV Kintamieji
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

// 4. Encryption Helperiai
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
  try {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getKey();
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encode(text)
    );
    return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
  } catch (error) {
    console.error("Encryption error:", error.message);
    toast.error("❌ Secure encryption failed. Please refresh.");
    throw error;
  }
};

export const decrypt = async (ciphertext) => {
  try {
    const { iv, data } = JSON.parse(atob(ciphertext));
    const key = await getKey();
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    return decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error.message);
    toast.error("❌ Secure decryption failed. Please re-login.");
    throw error;
  }
};

// 5. Context Setup
export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// 6. Provider
export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isClient = typeof window !== "undefined";

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState({});
  const [rates, setRates] = useState({});
  const [activeNetwork, setActiveNetwork] = useState("eth");
  const [authLoading, setAuthLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);

  const inactivityTimer = useRef(null);
  const balanceInterval = useRef(null);
  const sessionWatcher = useRef(null);
  const lastSessionRefresh = useRef(Date.now());

  // 7. Load Session ir stebėti pakeitimus
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

  // 8. Auto Load Wallet
  useEffect(() => {
    if (!isClient || authLoading || !user?.email) return;
    loadOrCreateWallet(user.email);
  }, [authLoading, user]);

  // 9. Auto Redirect į Dashboard
  useEffect(() => {
    if (!isClient) return;
    if (!authLoading && user && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [authLoading, user, pathname]);

  // 10. Inactivity Timeout (Auto Logout)
  useEffect(() => {
    if (!isClient) return;
    const resetTimer = () => {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        toast.error("You have been automatically logged out for your security.");
        signOut(true);
      }, 10 * 60 * 1000);
    };
    ["mousemove", "keydown", "touchstart"].forEach((event) =>
      window.addEventListener(event, resetTimer)
    );
    resetTimer();
    return () => {
      clearTimeout(inactivityTimer.current);
      ["mousemove", "keydown", "touchstart"].forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, []);

  // 11. Real-Time Session Watcher
  useEffect(() => {
    if (!isClient) return;
    if (user) {
      try {
        sessionWatcher.current = startSessionWatcher({
          onSessionInvalid: async () => {
            toast.error("⚠️ Session expired. Redirecting...");
            setTimeout(() => signOut(false), 3000);
          },
          intervalMinutes: 1,
        });
        sessionWatcher.current.start();
      } catch (error) {
        console.error("Session watcher error:", error.message);
        toast.error("⚠️ Session monitoring failed. Please re-login.");
      }
    } else {
      sessionWatcher.current?.stop();
      sessionWatcher.current = null;
    }
    return () => {
      sessionWatcher.current?.stop();
      sessionWatcher.current = null;
    };
  }, [user]);

  const safeRefreshSession = async () => {
    if (Date.now() - lastSessionRefresh.current < 60000) return;
    lastSessionRefresh.current = Date.now();
    try {
      await supabase.auth.refreshSession();
    } catch (error) {
      console.error("Session refresh failed:", error.message);
    }
  };

  // Wallet Functions
  const loadOrCreateWallet = async (email) => {
    try {
      setWalletLoading(true);
      const { data, error } = await supabase.from("wallets").select("*").eq("user_email", email).maybeSingle();
      if (error) throw error;
      if (data && data.encrypted_key) {
        const decryptedKey = await decrypt(data.encrypted_key);
        setupWallet(decryptedKey);
      } else {
        await createAndStoreWallet(email);
      }
    } catch (error) {
      console.error("Wallet load error:", error.message);
      toast.error("❌ Failed to load wallet. Try again.");
      setWallet(null);
    } finally {
      setWalletLoading(false);
    }
  };

  const createAndStoreWallet = async (email) => {
    try {
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
      toast.success("✅ Wallet created successfully!");
    } catch (error) {
      console.error("Create wallet error:", error.message);
      toast.error("❌ Wallet creation failed. Please refresh and try again.");
    }
  };

  const setupWallet = (privateKey) => {
    const baseWallet = new ethers.Wallet(privateKey);
    const signers = {};
    Object.entries(RPC).forEach(([net, url]) => {
      signers[net] = new ethers.Wallet(privateKey, new ethers.JsonRpcProvider(url));
    });
    setWallet({ wallet: baseWallet, signers });

    loadBalances(signers);

    if (balanceInterval.current) clearInterval(balanceInterval.current);
    balanceInterval.current = setInterval(() => loadBalances(signers), 180000);
  };

  const loadBalances = async (signers) => {
    try {
      const rateData = await fetchRates();
      const balancesData = await Promise.all(
        Object.keys(signers).map(async (network) => {
          const balance = await signers[network].getBalance();
          return { network, balance: parseFloat(ethers.formatEther(balance)) };
        })
      );
      const balancesObj = {};
      balancesData.forEach(({ network, balance }) => {
        balancesObj[network] = balance;
      });
      setBalances(balancesObj);
      setRates(rateData);
    } catch (error) {
      console.error("Balances error:", error.message);
    }
  };

  const fetchRates = async () => {
    try {
      const ids = "ethereum,binancecoin,polygon,avalanche-2";
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`);
      return await res.json();
    } catch (error) {
      console.error("Rates fetch error:", error.message);
      return {};
    }
  };

  const reloadWallet = async (email) => {
    try {
      await loadOrCreateWallet(email);
      toast.success("✅ Wallet reloaded successfully!");
    } catch (error) {
      console.error("Reload wallet error:", error.message);
      toast.error("❌ Failed to reload wallet.");
    }
  };

  // Auth Functions
  const signInWithMagicLink = async (email) => {
    try {
      const origin = isClient ? window.location.origin : "https://nordbalticum.com";
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: `${origin}/dashboard` },
      });
      if (error) {
        console.error(error.message);
        toast.error("❌ Magic Link login failed. Try again.");
        throw error;
      }
    } catch (error) {
      console.error("Magic Link error:", error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const origin = isClient ? window.location.origin : "https://nordbalticum.com";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/dashboard` },
      });
      if (error) {
        console.error(error.message);
        toast.error("❌ Google login failed. Try again.");
        throw error;
      }
    } catch (error) {
      console.error("Google login error:", error.message);
    }
  };

  const signOut = async (showToast = false) => {
    await supabase.auth.signOut();
    setUser(null);
    setWallet(null);
    setBalances({});
    setRates({});
    setActiveNetwork("eth");
    if (balanceInterval.current) clearInterval(balanceInterval.current);
    balanceInterval.current = null;
    sessionWatcher.current?.stop();
    sessionWatcher.current = null;
    if (isClient) {
      ["userPrivateKey", "activeNetwork", "sessionData"].forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove ${key}`);
        }
      });
    }
    router.replace("/");
    if (showToast) {
      toast.info("You have been logged out due to inactivity.", {
        position: "top-center",
        autoClose: 4000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        balances,
        rates,
        activeNetwork,
        setActiveNetwork,
        authLoading,
        walletLoading,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
        reloadWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
