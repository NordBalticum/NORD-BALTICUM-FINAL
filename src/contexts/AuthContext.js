"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Wallet, JsonRpcProvider, parseEther, formatEther, isAddress } from "ethers";
import { supabase } from "@/utils/supabaseClient";

// === 1️⃣ RPC Tinklai ir Coin Mapping
const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

const coinMap = {
  eth: "ethereum",
  bnb: "binancecoin",
  tbnb: "binancecoin",
  matic: "polygon",
  avax: "avalanche-2",
};

// === 2️⃣ Admin Address ir Encryption Secret
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET;
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "nordbalticum-fallback";

// === 3️⃣ Encryption/Decryption funkcijos
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

const encrypt = async (text) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encode(text));
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
};

const decrypt = async (ciphertext) => {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey();
  const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, new Uint8Array(data));
  return decode(decrypted);
};

// === 4️⃣ Context
export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// === 5️⃣ AuthProvider
export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState({});
  const [rates, setRates] = useState({});
  const [activeNetwork, setActiveNetwork] = useState("eth");
  const [loading, setLoading] = useState(true);

  const inactivityTimer = useRef(null);
  const balanceInterval = useRef(null);

  const isClient = typeof window !== "undefined";

  // === 6️⃣ Load Session iš Supabase
  useEffect(() => {
    if (!isClient) return;
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Session load error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, [isClient]);

  // === 7️⃣ Auto Wallet Loader su Self-Healing
  useEffect(() => {
    if (!isClient) return;
    if (!user?.email) return;
    if (wallet?.wallet?.address) return;
    loadOrCreateWallet(user.email);
  }, [user, isClient, wallet]);

  // === 8️⃣ Auto Redirect po login į Dashboard
  useEffect(() => {
    if (!isClient) return;
    if (!loading && user && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [user, loading, pathname, router, isClient]);

  // === 9️⃣ Inactivity Logout po 10 minučių
  useEffect(() => {
    if (!isClient) return;
    const resetTimer = () => {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        signOut();
      }, 10 * 60 * 1000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer.current);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, [isClient]);

  // === 1️⃣0️⃣ Load Active Network iš LocalStorage
  useEffect(() => {
    if (!isClient) return;
    const stored = localStorage.getItem("activeNetwork");
    if (stored) setActiveNetwork(stored);
  }, [isClient]);

  useEffect(() => {
    if (isClient && activeNetwork) {
      localStorage.setItem("activeNetwork", activeNetwork);
    }
  }, [activeNetwork, isClient]);

  // === 1️⃣1️⃣ Load arba Create Wallet su pilnu fallback
  const loadOrCreateWallet = async (email) => {
    try {
      setLoading(true);

      // 1️⃣ Bandom iš localStorage
      const localKey = loadPrivateKey();
      if (localKey && isAddress(new Wallet(localKey).address)) {
        console.log("✅ Loaded wallet from localStorage.");
        setupWallet(localKey);
        return;
      } else {
        console.warn("⚠️ No valid local key found, trying Supabase...");
        localStorage.removeItem("userPrivateKey");
      }

      // 2️⃣ Bandom iš Supabase
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_email", email)
        .maybeSingle();

      if (error) throw error;

      if (data?.encrypted_key) {
        const decrypted = await decrypt(data.encrypted_key);
        if (decrypted && isAddress(new Wallet(decrypted).address)) {
          console.log("✅ Loaded wallet from Supabase.");
          savePrivateKey(decrypted);
          setupWallet(decrypted);
          return;
        } else {
          console.warn("⚠️ Supabase key invalid, creating new wallet...");
        }
      } else {
        console.warn("⚠️ No wallet found in Supabase, creating new...");
      }

      // 3️⃣ Jei nėra local ir nėra Supabase — sukuriam naują
      const newWallet = Wallet.createRandom();
      const encrypted = await encrypt(newWallet.privateKey);

      const { error: insertError } = await supabase.from("wallets").insert({
        user_email: email,
        eth_address: newWallet.address,
        bnb_address: newWallet.address,
        tbnb_address: newWallet.address,
        matic_address: newWallet.address,
        avax_address: newWallet.address,
        encrypted_key: encrypted,
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      console.log("🚀 New wallet created and stored to Supabase!");

      savePrivateKey(newWallet.privateKey);
      setupWallet(newWallet.privateKey);

    } catch (error) {
      console.error("❌ Wallet load error:", error.message);

      if (email) {
        await supabase.from("logs").insert({
          user_email: email,
          type: "wallet_error",
          message: error.message,
        });
      }

      setWallet(null);

    } finally {
      setLoading(false);
    }
  };

  // === 1️⃣2️⃣ Setup Wallet ir RPC signers
  const setupWallet = (key) => {
    const baseWallet = new Wallet(key);
    const signers = {};

    Object.entries(RPC).forEach(([network, rpcUrl]) => {
      signers[network] = new Wallet(key, new JsonRpcProvider(rpcUrl));
    });

    setWallet({ wallet: baseWallet, signers });
    loadBalances(signers);

    if (balanceInterval.current) clearInterval(balanceInterval.current);
    balanceInterval.current = setInterval(() => loadBalances(signers), 180000); // kas 3 min
  };

  const savePrivateKey = (key) => {
    if (!isClient) return;
    if (!localStorage.getItem("userPrivateKey")) {
      localStorage.setItem("userPrivateKey", JSON.stringify({ key }));
    }
  };

  const loadPrivateKey = () => {
    if (!isClient) return null;
    const stored = localStorage.getItem("userPrivateKey");
    return stored ? JSON.parse(stored)?.key : null;
  };

  // === 1️⃣3️⃣ Load Balances + Coin Rates
  const loadBalances = async (signers) => {
    try {
      const rateData = await fetchRates();
      const promises = Object.keys(signers).map(async (net) => {
        const balance = await signers[net].getBalance();
        return { network: net, balance: parseFloat(formatEther(balance)) };
      });

      const results = await Promise.all(promises);
      const balancesObj = {};
      results.forEach(({ network, balance }) => {
        balancesObj[network] = balance;
      });

      setBalances(balancesObj);
      setRates(rateData);
    } catch (error) {
      console.error("Load balances error:", error.message);
    }
  };

  const fetchRates = async () => {
    try {
      const ids = Object.values(coinMap).join(",");
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`;
      const res = await fetch(url);
      return await res.json();
    } catch (error) {
      console.error("Rates fetch error:", error.message);
      return {};
    }
  };

  const refreshBalance = async (network) => {
    if (!wallet?.signers?.[network]) return;
    try {
      const balance = await wallet.signers[network].getBalance();
      setBalances((prev) => ({
        ...prev,
        [network]: parseFloat(formatEther(balance)),
      }));
    } catch (error) {
      console.error("Refresh balance error:", error.message);
    }
  };

  // === 1️⃣4️⃣ Login ir Logout funkcijos
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

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Logout error:", error.message);
    } finally {
      setUser(null);
      setWallet(null);
      if (balanceInterval.current) clearInterval(balanceInterval.current);
      if (isClient) {
        localStorage.removeItem("userPrivateKey");
        localStorage.removeItem("activeNetwork");
      }
      router.replace("/");
    }
  };

  // === 1️⃣5️⃣ Send Transaction su 3% fee
  const sendTransaction = async ({ receiver, amount, network }) => {
    try {
      if (!wallet?.signers?.[network]) throw new Error("Wallet not ready");
      if (!ADMIN_ADDRESS) throw new Error("Admin address missing");

      const signer = wallet.signers[network];
      const value = parseEther(amount.toString());
      const fee = value.mul(3).div(100);
      const toSend = value.sub(fee);

      const [userTx, feeTx] = await Promise.all([
        signer.sendTransaction({ to: receiver, value: toSend, gasLimit: 21000 }),
        signer.sendTransaction({ to: ADMIN_ADDRESS, value: fee, gasLimit: 21000 }),
      ]);

      if (user?.email) {
        await supabase.from("logs").insert({
          user_email: user.email,
          type: "send_success",
          message: userTx.hash,
        });
      }

      return { success: true, txHash: userTx.hash, feeHash: feeTx.hash };
    } catch (error) {
      console.error("Send transaction error:", error.message);

      if (user?.email) {
        await supabase.from("logs").insert({
          user_email: user.email,
          type: "send_error",
          message: error.message,
        });
      }

      return { success: false, message: error.message };
    }
  };

  // === 1️⃣6️⃣ Return Context
  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        balances,
        rates,
        activeNetwork,
        setActiveNetwork,
        loading,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
        sendTransaction,
        refreshBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
