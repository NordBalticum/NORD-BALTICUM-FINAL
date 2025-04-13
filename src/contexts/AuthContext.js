"use client";

// 1️⃣ Importai
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Wallet, JsonRpcProvider, formatEther } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "react-toastify"; // <-- Pridedam Toast
import "react-toastify/dist/ReactToastify.css"; // <-- Toast CSS

// 2️⃣ RPC URL'ai
const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

// 3️⃣ ENV kintamieji
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET;
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

// 4️⃣ Encryption Helperiai
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
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encode(text));
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
};

export const decrypt = async (ciphertext) => {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey();
  const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, new Uint8Array(data));
  return decode(decrypted);
};

// 5️⃣ Context Setup
export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// 6️⃣ Provider
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

  // 7️⃣ Load Session
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
    });

    return () => subscription?.unsubscribe();
  }, []);

  // 8️⃣ Auto Load Wallet kai user yra
  useEffect(() => {
    if (!isClient || authLoading || !user?.email) return;
    loadOrCreateWallet(user.email);
  }, [authLoading, user]);

  // 9️⃣ Auto redirect į dashboard
  useEffect(() => {
    if (!isClient) return;
    if (!authLoading && user && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [authLoading, user, pathname]);

  // 🔟 Inactivity Timeout (Auto Logout)
  useEffect(() => {
    if (!isClient) return;

    const resetTimer = () => {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        signOut(true); // <-- iškviečiam su true kad rodyti Toast
      }, 10 * 60 * 1000);
    };

    const activityEvents = ["mousemove", "keydown", "touchstart"];
    activityEvents.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer.current);
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  // ✅ Saugus Wallet load arba Create
  const loadOrCreateWallet = async (email) => {
    try {
      setWalletLoading(true);

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_email", email)
        .maybeSingle();

      if (error) throw error;

      if (data && Object.keys(data).length > 0 && data.encrypted_key) {
        const decryptedKey = await decrypt(data.encrypted_key);
        setupWallet(decryptedKey);
      } else if (data && Object.keys(data).length > 0 && !data.encrypted_key) {
        console.warn("Found invalid wallet record. Deleting...");
        await supabase.from("wallets").delete().eq("user_email", email);
        await createAndStoreWallet(email);
      } else {
        await createAndStoreWallet(email);
      }

    } catch (error) {
      console.error("Wallet load error:", error.message);
      setWallet(null);
    } finally {
      setWalletLoading(false);
    }
  };

  const createAndStoreWallet = async (email) => {
    const newWallet = Wallet.createRandom();
    const encryptedKey = await encrypt(newWallet.privateKey);

    const { error } = await supabase.from("wallets").insert({
      user_email: email,
      eth_address: newWallet.address,
      encrypted_key: encryptedKey,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    setupWallet(newWallet.privateKey);
  };

  const setupWallet = (privateKey) => {
    const baseWallet = new Wallet(privateKey);
    const signers = {};
    Object.entries(RPC).forEach(([net, url]) => {
      signers[net] = new Wallet(privateKey, new JsonRpcProvider(url));
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
          return { network, balance: parseFloat(formatEther(balance)) };
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
      const ids = ["ethereum", "binancecoin", "polygon", "avalanche-2"].join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`);
      return await res.json();
    } catch (error) {
      console.error("Rates fetch error:", error.message);
      return {};
    }
  };

  const reloadWallet = async (email) => {
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
      }
    } catch (error) {
      console.error("Reload Wallet Error:", error.message);
    } finally {
      setWalletLoading(false);
    }
  };

  const signInWithMagicLink = async (email) => {
    const origin = isClient ? window.location.origin : "https://nordbalticum.com";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${origin}/dashboard` },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const origin = isClient ? window.location.origin : "https://nordbalticum.com";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/dashboard` },
    });
    if (error) throw error;
  };

  // ✅ Premium signOut
  const signOut = async (showToast = false) => {
    await supabase.auth.signOut();
    setUser(null);
    setWallet(null);
    if (balanceInterval.current) clearInterval(balanceInterval.current);
    if (isClient) {
      localStorage.removeItem("userPrivateKey");
      localStorage.removeItem("activeNetwork");
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
