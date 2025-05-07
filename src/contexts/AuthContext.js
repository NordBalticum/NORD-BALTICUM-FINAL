"use client";

// =======================================
// 🔐 AuthContext.js — FINAL META-GRADE V1 (1/4)
// =======================================

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
import fallbackRPCs from "@/utils/fallbackRPCs";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

// =======================================
// 🔐 AES-GCM ENCRYPTION — 101% BULLETPROOF
// =======================================

const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

if (!ENCRYPTION_SECRET && typeof window !== "undefined") {
  console.error("❌ ENV klaida: NEXT_PUBLIC_ENCRYPTION_SECRET trūksta");
}

const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async () => {
  if (typeof window === "undefined") throw new Error("❌ getKey veikia tik naršyklėje");

  const baseKey = await crypto.subtle.importKey(
    "raw", encode(ENCRYPTION_SECRET),
    { name: "PBKDF2" }, false, ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
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

export const encrypt = async (text) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();
  const data = encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
};

export const decrypt = async (ciphertext) => {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return decode(decrypted);
};

export const isValidPrivateKey = (key) =>
  typeof key === "string" && /^0x[a-fA-F0-9]{64}$/.test(key.trim());

// =======================================
// 🌐 Konteksto inicijavimas
// =======================================
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// =======================================
// 🚀 AuthProvider – Wallet Setup & Core Logic
// =======================================
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

  // 🧱 Setup signeriai per fallbackRPCs
  const setupWallet = useCallback((privateKey) => {
    const base = new ethers.Wallet(privateKey);
    const signers = {};

    for (const key in fallbackRPCs) {
      const net = fallbackRPCs[key];
      if (!net?.rpcs?.length) continue;
      try {
        const provider = new ethers.JsonRpcProvider(net.rpcs[0], net.chainId);
        signers[key] = new ethers.Wallet(privateKey, provider);
      } catch (err) {
        console.warn(`⚠️ ${net.label} RPC setup klaida:`, err.message);
      }
    }

    setWallet({ wallet: base, signers });
  }, []);

  // ✨ Naujas wallet (jei pirmas login)
  const createAndStoreWallet = useCallback(async (email) => {
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
    toast.success("✅ Wallet sukurtas", { position: "top-center", autoClose: 3000 });
  }, [setupWallet]);

  // 🔄 Įkeliam arba sukuriam wallet
  const loadOrCreateWallet = useCallback(async (email) => {
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
      console.error("❌ Wallet įkėlimo klaida:", err.message);
      toast.error("❌ Wallet klaida", { position: "top-center", autoClose: 3000 });
      setWallet(null);
    } finally {
      setWalletLoading(false);
    }
  }, [createAndStoreWallet, setupWallet]);

  // 🔓 Importavimas per rankinį privKey
  const importWalletFromPrivateKey = useCallback(async (email, privateKey) => {
    if (!isValidPrivateKey(privateKey)) {
      toast.error("❌ Netinkamas privatus raktas", { position: "top-center", autoClose: 3000 });
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
      toast.success("✅ Wallet importuotas", { position: "top-center", autoClose: 3000 });
    } catch (err) {
      console.error("❌ Importavimo klaida:", err.message);
      toast.error("❌ Nepavyko importuoti", { position: "top-center", autoClose: 3000 });
    } finally {
      setWalletLoading(false);
    }
  }, [setupWallet]);

  // =======================================
  // 🔁 Saugus sesijos atnaujinimas (kas max 60s)
  // =======================================
  const safeRefreshSession = useCallback(async () => {
    if (Date.now() - lastSessionRefresh.current < 60_000) return;
    lastSessionRefresh.current = Date.now();

    try {
      const { data: { session: newSession } } = await supabase.auth.refreshSession();
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
      } else {
        console.warn("⚠️ Sesija pasibaigė – sign out");
        setSession(null);
        setUser(null);
        setWallet(null);
      }
    } catch (err) {
      console.error("❌ Sesijos atnaujinimo klaida:", err.message);
      setSession(null);
      setUser(null);
      setWallet(null);
    }
  }, []);

  // =======================================
  // ✉️ Prisijungimas per MagicLink (OTP)
  // =======================================
  const signInWithMagicLink = useCallback(async (email) => {
    const redirectTo = (isClient ? window.location.origin : "https://nordbalticum.com") + "/dashboard";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      toast.error("❌ Magic link klaida", { position: "top-center", autoClose: 3000 });
      throw error;
    }
  }, [isClient]);

  // =======================================
  // 🔐 Prisijungimas su Google OAuth
  // =======================================
  const signInWithGoogle = useCallback(async () => {
    const redirectTo = (isClient ? window.location.origin : "https://nordbalticum.com") + "/dashboard";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      toast.error("❌ Google prisijungimo klaida", { position: "top-center", autoClose: 3000 });
      throw error;
    }
  }, [isClient]);

  // =======================================
  // 🚪 Atsijungimas – sesijos ir localStorage išvalymas
  // =======================================
  const signOut = useCallback(async (showToast = false, redirectPath = "/") => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("❌ Atsijungimo klaida:", err.message);
    }

    setUser(null);
    setSession(null);
    setWallet(null);

    if (isClient) {
      ["userPrivateKey", "activeNetwork", "sessionData"].forEach(k => localStorage.removeItem(k));
    }

    router.replace(redirectPath);

    if (showToast) {
      toast.info("👋 Atsijungta", { position: "top-center", autoClose: 3000 });
    }
  }, [router, isClient]);

  // =======================================
  // 🧠 useEffect – sesijos inicializavimas iš Supabase
  // =======================================
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
        console.error("❌ Pradinis sesijos užkrovimas nepavyko:", err.message);
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

  // =======================================
  // 💾 Wallet address + sukūrimo data į localStorage
  // =======================================
  useEffect(() => {
    if (!wallet?.wallet?.address) return;

    try {
      localStorage.setItem("walletAddress", wallet.wallet.address);
      localStorage.setItem("walletCreatedAt", Date.now().toString());
    } catch (err) {
      console.warn("⚠️ Nepavyko įrašyti wallet info į localStorage:", err);
    }
  }, [wallet?.wallet?.address]);
  
  // =======================================
  // 🪝 Wallet įkėlimas kai turim user email
  // =======================================
  useEffect(() => {
    if (!isClient || authLoading || !user?.email) return;
    loadOrCreateWallet(user.email);
  }, [authLoading, user?.email, isClient, loadOrCreateWallet]);

  // =======================================
  // 👁️ Sesijos atnaujinimas kai grįžta į tabą ar focusuoja
  // =======================================
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
      window.removeEventListener("visibilitychange", onVisible);
    };
  }, [safeRefreshSession, isClient]);

  // =======================================
  // ⏱️ Auto logout po 15min inaktyvumo
  // =======================================
  useEffect(() => {
    if (!isClient) return;

    const events = ["mousemove", "keydown", "click", "touchstart"];
    const resetTimer = () => {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => signOut(true), 15 * 60 * 1000); // 15 min
    };

    events.forEach(evt => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [signOut, isClient]);

// =======================================
// 🧠 Return AuthContext visai aplikacijai
// =======================================
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

      // ✅ Pridėti patogūs helperiai visai sistemai
      getSignerForChain: (chainId) => wallet?.signers?.[chainId] || null,
      getAddressForChain: (chainId) => wallet?.signers?.[chainId]?.address || null,
      getPrimaryAddress: () => wallet?.wallet?.address || null,
      getWalletCreatedAt: () => {
        try {
          const timestamp = localStorage.getItem("walletCreatedAt");
          return timestamp ? new Date(parseInt(timestamp, 10)) : null;
        } catch {
          return null;
        }
      },
    }}
  >
    {!authLoading && children}
  </AuthContext.Provider>
);
