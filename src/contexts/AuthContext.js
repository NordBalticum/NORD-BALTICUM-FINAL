"use client";

// 1. IMPORTAI
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Wallet, JsonRpcProvider, parseEther, formatEther, isAddress } from "ethers";
import { supabase } from "@/utils/supabaseClient";

// 2. RPC TINKLAI
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

// 3. ENV Secretai
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET;
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

// 4. ENCRYPT / DECRYPT
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async () => {
  const keyMaterial = await window.crypto.subtle.importKey("raw", encode(ENCRYPTION_SECRET), { name: "PBKDF2" }, false, ["deriveKey"]);
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: encode("nordbalticum-salt"), iterations: 100000, hash: "SHA-256" },
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

// 5. CONTEXT
export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// 6. PROVIDER
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

  // 7. LOAD SESSION
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

  // 8. AUTO LOAD WALLET
  useEffect(() => {
    if (!isClient || loading || !user?.email) return;
    console.log("✅ User authenticated, loading wallet for:", user.email);
    loadOrCreateWallet(user.email);
  }, [isClient, loading, user]);

  // 9. AUTO REDIRECT
  useEffect(() => {
    if (!isClient) return;
    if (!loading && user && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [isClient, loading, user, pathname, router]);

  // 10. INACTIVITY LOGOUT
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

  // 11. WALLET CREATION / FETCH
  const loadOrCreateWallet = async (email) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("wallets").select("*").eq("user_email", email).maybeSingle();
      if (error) throw error;

      if (data?.encrypted_key) {
        const decryptedKey = await decrypt(data.encrypted_key);
        setupWallet(decryptedKey);
        console.log("✅ Wallet loaded from Supabase.");
      } else {
        const newWallet = Wallet.createRandom();
        const encryptedKey = await encrypt(newWallet.privateKey);

        await supabase.from("wallets").insert({
          user_email: email,
          eth_address: newWallet.address,
          bnb_address: newWallet.address,
          tbnb_address: newWallet.address,
          matic_address: newWallet.address,
          avax_address: newWallet.address,
          encrypted_key: encryptedKey,
          created_at: new Date().toISOString(),
        });

        setupWallet(newWallet.privateKey);
        console.log("🚀 New wallet created and stored.");
      }
    } catch (error) {
      console.error("Wallet load error:", error.message);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  // 12. SETUP WALLET
  const setupWallet = (privateKey) => {
    const baseWallet = new Wallet(privateKey);
    const signers = {};
    Object.entries(RPC).forEach(([network, url]) => {
      signers[network] = new Wallet(privateKey, new JsonRpcProvider(url));
    });
    setWallet({ wallet: baseWallet, signers });
    loadBalances(signers);

    if (balanceInterval.current) clearInterval(balanceInterval.current);
    balanceInterval.current = setInterval(() => loadBalances(signers), 180000);
  };

  // 13. LOAD BALANCES
  const loadBalances = async (signers) => {
    try {
      const rateData = await fetchRates();
      const promises = Object.keys(signers).map(async (network) => {
        const balance = await signers[network].getBalance();
        return { network, balance: parseFloat(formatEther(balance)) };
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

  // 14. LOGIN / LOGOUT
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

// 15. SEND TRANSACTION
const sendTransaction = async ({ receiver, amount, network }) => {
  if (!wallet?.signers?.[network]) throw new Error("Wallet not ready");
  if (!ADMIN_ADDRESS) throw new Error("Admin address missing");

  const signer = wallet.signers[network];
  const value = parseEther(amount.toString());
  const fee = value.mul(3).div(100); // 3% fee
  const toSend = value.sub(fee);

  const [userTx, feeTx] = await Promise.all([
    signer.sendTransaction({ to: receiver, value: toSend, gasLimit: 21000 }),
    signer.sendTransaction({ to: ADMIN_ADDRESS, value: fee, gasLimit: 21000 }),
  ]);

  return { success: true, txHash: userTx.hash, feeHash: feeTx.hash };
};
  
  // 16. CONTEXT RETURN
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
