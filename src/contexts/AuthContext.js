"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { Wallet, JsonRpcProvider } from "ethers";

export const AuthContext = createContext();

// RPC URL'ai
const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

// ENCRYPTION
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "nordbalticum-fallback";

const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async (password) => {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encode(password),
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

const encrypt = async (text) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(ENCRYPTION_SECRET);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encode(text)
  );
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
};

const decrypt = async (ciphertext) => {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey(ENCRYPTION_SECRET);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return decode(decrypted);
};

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [activeNetwork, setActiveNetwork] = useState("eth");
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef(null);

  // 1️⃣ Load Supabase Session
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Supabase session error:", error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 2️⃣ Load Wallet when User is Ready
  useEffect(() => {
    if (!user?.email || typeof window === "undefined") return;
    loadOrCreateWallet(user.email);
  }, [user]);

  // 3️⃣ Auto Redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!loading && user && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [user, loading, pathname, router]);

  // 4️⃣ Auto Logout after 10min inactivity
  useEffect(() => {
    if (typeof window === "undefined") return;

    const resetTimer = () => {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        signOut();
      }, 10 * 60 * 1000); // 10 min
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer.current);
      if (typeof window !== "undefined") {
        window.removeEventListener("mousemove", resetTimer);
        window.removeEventListener("keydown", resetTimer);
      }
    };
  }, []);

  // 5️⃣ Remember activeNetwork in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedNetwork = localStorage.getItem("activeNetwork");
      if (storedNetwork) setActiveNetwork(storedNetwork);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && activeNetwork) {
      localStorage.setItem("activeNetwork", activeNetwork);
    }
  }, [activeNetwork]);

  // 6️⃣ Wallet Functions
  const loadOrCreateWallet = async (email) => {
    setLoading(true);
    try {
      const localKey = await loadPrivateKeyFromStorage();
      if (localKey) {
        const loadedWallet = new Wallet(localKey);
        setWallet(generateWallets(loadedWallet));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_email", email)
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (data?.encrypted_key) {
        const decryptedKey = await decrypt(data.encrypted_key);
        await savePrivateKeyToStorage(decryptedKey);
        const loadedWallet = new Wallet(decryptedKey);
        setWallet(generateWallets(loadedWallet));
      } else {
        const newWallet = Wallet.createRandom();
        const encryptedKey = await encrypt(newWallet.privateKey);
        await supabase.from("wallets").insert({
          user_email: email,
          encrypted_key: encryptedKey,
          eth_address: newWallet.address,
          bnb_address: newWallet.address,
          tbnb_address: newWallet.address,
          matic_address: newWallet.address,
          avax_address: newWallet.address,
        });
        await savePrivateKeyToStorage(newWallet.privateKey);
        setWallet(generateWallets(newWallet));
      }
    } catch (err) {
      console.error("Wallet error:", err);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  const generateWallets = (wallet) => {
    const signers = {};
    Object.entries(RPC).forEach(([network, rpcUrl]) => {
      signers[network] = new Wallet(wallet.privateKey, new JsonRpcProvider(rpcUrl));
    });
    return { wallet, signers };
  };

  const savePrivateKeyToStorage = async (privateKey) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("userPrivateKey", JSON.stringify({ key: privateKey }));
  };

  const loadPrivateKeyFromStorage = async () => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("userPrivateKey");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.key || null;
  };

  // 7️⃣ Magic Link Login
  const signInWithMagicLink = async (email) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://nordbalticum.com";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  // 8️⃣ Google OAuth Login
  const signInWithGoogle = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://nordbalticum.com";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  // 9️⃣ Logout
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Sign out error:", error.message);
    } catch (err) {
      console.warn("Logout exception:", err);
    } finally {
      setUser(null);
      setWallet(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("userPrivateKey");
      }
      router.replace("/");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        activeNetwork,
        setActiveNetwork,
        loading,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
