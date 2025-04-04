"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Wallet, JsonRpcProvider, parseEther, formatEther } from "ethers";
import { supabase } from "@/utils/supabaseClient";

// 1️⃣ RPC Tinklai
const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

// 2️⃣ Coin Mapping
const coinMap = {
  eth: "ethereum",
  bnb: "binancecoin",
  tbnb: "binancecoin",
  matic: "polygon",
  avax: "avalanche-2",
};

// 3️⃣ Admin address ir encryption slaptažodis
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET;
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || "nordbalticum-fallback";

// 4️⃣ Encryption/Decryption funkcijos
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

// 5️⃣ Contextas
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState({});
  const [rates, setRates] = useState({});
  const [activeNetwork, setActiveNetwork] = useState("eth");
  const [loading, setLoading] = useState(true);
  const [privateKey, setPrivateKey] = useState(null);
  const inactivityTimer = useRef(null);

  const isClient = typeof window !== "undefined";

  // 6️⃣ Supabase session loader
  useEffect(() => {
    if (!isClient) return;
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Session load error:", error.message);
        setUser(null);
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

  // 7️⃣ Wallet loader
  useEffect(() => {
    if (!user?.email || !isClient) return;
    loadOrCreateWallet(user.email);
  }, [user, isClient]);

  // 8️⃣ Auto redirect
  useEffect(() => {
    if (!isClient) return;
    if (!loading && user && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [user, loading, pathname, router, isClient]);

  // 9️⃣ Auto logout after 10min
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

  // 1️⃣0️⃣ Load Active Network from localStorage
  useEffect(() => {
    if (isClient) {
      const stored = localStorage.getItem("activeNetwork");
      if (stored) setActiveNetwork(stored);
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient && activeNetwork) {
      localStorage.setItem("activeNetwork", activeNetwork);
    }
  }, [activeNetwork, isClient]);

  // 1️⃣1️⃣ Load or Create Wallet
  const loadOrCreateWallet = async (email) => {
    setLoading(true);
    try {
      const localKey = loadPrivateKey();
      if (localKey) {
        setupWallet(localKey);
        return;
      }

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_email", email)
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (data?.encrypted_key) {
        const decrypted = await decrypt(data.encrypted_key);
        savePrivateKey(decrypted);
        setupWallet(decrypted);
      } else {
        const newWallet = Wallet.createRandom();
        const encrypted = await encrypt(newWallet.privateKey);
        await supabase.from("wallets").insert({
          user_email: email,
          eth_address: newWallet.address,
          bnb_address: newWallet.address,
          tbnb_address: newWallet.address,
          matic_address: newWallet.address,
          avax_address: newWallet.address,
          encrypted_key: encrypted,
        });
        savePrivateKey(newWallet.privateKey);
        setupWallet(newWallet.privateKey);
      }
    } catch (err) {
      console.error("Wallet loading error:", err);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  const setupWallet = (key) => {
    const baseWallet = new Wallet(key);
    const signers = {};

    Object.entries(RPC).forEach(([network, rpcUrl]) => {
      signers[network] = new Wallet(key, new JsonRpcProvider(rpcUrl));
    });

    setWallet({ wallet: baseWallet, signers });
    setPrivateKey(key);
    loadBalances(signers);
  };

  // 1️⃣2️⃣ Save and Load PrivateKey
  const savePrivateKey = (key) => {
    if (!isClient) return;
    localStorage.setItem("userPrivateKey", JSON.stringify({ key }));
  };

  const loadPrivateKey = () => {
    if (!isClient) return null;
    const stored = localStorage.getItem("userPrivateKey");
    if (!stored) return null;
    return JSON.parse(stored)?.key || null;
  };

  // 1️⃣3️⃣ Balances + Rates
  const loadBalances = async (signers) => {
    try {
      const rateData = await fetchRates();
      const promises = Object.keys(signers).map(async (net) => {
        const bal = await signers[net].getBalance();
        return { network: net, balance: parseFloat(formatEther(bal)) };
      });

      const results = await Promise.all(promises);
      const balanceResult = {};

      results.forEach(({ network, balance }) => {
        balanceResult[network] = balance;
      });

      setBalances(balanceResult);
      setRates(rateData);
    } catch (err) {
      console.error("Load balances error:", err);
    }
  };

  const fetchRates = async () => {
    try {
      const ids = Object.values(coinMap).join(",");
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`;
      const res = await fetch(url);
      return await res.json();
    } catch (err) {
      console.error("Rates fetch error:", err);
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
    } catch (err) {
      console.error("Refresh balance error:", err);
    }
  };

  // 1️⃣4️⃣ Magic Link Login
  const signInWithMagicLink = async (email) => {
    const origin = isClient ? window.location.origin : "https://nordbalticum.com";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  // 1️⃣5️⃣ Google OAuth Login
  const signInWithGoogle = async () => {
    const origin = isClient ? window.location.origin : "https://nordbalticum.com";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  // 1️⃣6️⃣ SignOut
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setUser(null);
      setWallet(null);
      if (isClient) localStorage.removeItem("userPrivateKey");
      router.replace("/");
    }
  };

  // 1️⃣7️⃣ Send Transaction (su 3% fee)
  const sendTransaction = async ({ receiver, amount, network }) => {
    try {
      if (!wallet?.signers?.[network] || !privateKey) throw new Error("Wallet not ready.");
      if (!ADMIN_ADDRESS) throw new Error("Admin address missing.");

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
      console.error("Send transaction error:", error);

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

export const useAuth = () => useContext(AuthContext);
