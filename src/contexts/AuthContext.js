"use client";

// 1️⃣ Importai
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Wallet, JsonRpcProvider, parseEther, formatEther } from "ethers";
import { supabase } from "@/utils/supabaseClient";

// 2️⃣ RPC Tinklai
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

// 4️⃣ Šifravimas ir Dešifravimas
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

// 5️⃣ Kontekstas
export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// 6️⃣ Provideris
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
        setLoading(false);
      }
    };
    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, [isClient]);

  // 8️⃣ Kai user yra – kraunam wallet
  useEffect(() => {
    if (!isClient || loading || !user?.email) return;
    console.log("User ready, loading wallet for:", user.email);
    loadOrCreateWallet(user.email);
  }, [isClient, loading, user]);

  // 9️⃣ Auto Redirect
  useEffect(() => {
    if (!isClient) return;
    if (!loading && user && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [isClient, loading, user, pathname, router]);

  // 🔟 Inactivity auto logout
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

  // 1️⃣1️⃣ Load arba Create Wallet
  const loadOrCreateWallet = async (email) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_email", email)
        .maybeSingle();

      if (error) throw error;

      if (data?.encrypted_key) {
        console.log("✅ Wallet found, decrypting...");
        const decryptedKey = await decrypt(data.encrypted_key);
        setupWallet(decryptedKey);
      } else {
        console.log("🚀 No wallet found, creating...");
        const newWallet = Wallet.createRandom();
        const encryptedKey = await encrypt(newWallet.privateKey);

        await supabase.from("wallets").insert({
          user_email: email,
          eth_address: newWallet.address,
          encrypted_key: encryptedKey,
          created_at: new Date().toISOString(),
        });

        setupWallet(newWallet.privateKey);
      }
    } catch (error) {
      console.error("❌ Wallet load/create error:", error.message);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  // 1️⃣2️⃣ Setup Wallet
  const setupWallet = (privateKey) => {
    const baseWallet = new Wallet(privateKey);
    const signers = {};
    Object.entries(RPC).forEach(([net, rpcUrl]) => {
      signers[net] = new Wallet(privateKey, new JsonRpcProvider(rpcUrl));
    });
    setWallet({ wallet: baseWallet, signers });
    loadBalances(signers);

    if (balanceInterval.current) clearInterval(balanceInterval.current);
    balanceInterval.current = setInterval(() => loadBalances(signers), 180000);
  };

  // 1️⃣3️⃣ Balances ir Rates
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
      console.error("Load balances error:", error.message);
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

  // 1️⃣4️⃣ Auth Functions
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
    await supabase.auth.signOut();
    setUser(null);
    setWallet(null);
    if (balanceInterval.current) clearInterval(balanceInterval.current);
    if (isClient) {
      localStorage.removeItem("userPrivateKey");
      localStorage.removeItem("activeNetwork");
    }
    router.replace("/");
  };

  // 1️⃣5️⃣ Transaction su 3% Fee
  const sendTransaction = async ({ receiver, amount, network }) => {
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

    return { success: true, txHash: userTx.hash, feeHash: feeTx.hash };
  };

  // 1️⃣6️⃣ Return Context
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
