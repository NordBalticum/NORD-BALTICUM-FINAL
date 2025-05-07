// =======================================
// 🔐 AuthContext.js — FINAL META-GRADE V2 (LOCKED VERSION)
// =======================================

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
import fallbackRPCs from "@/utils/fallbackRPCs";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
if (!ENCRYPTION_SECRET && typeof window !== "undefined") {
  console.error("❌ ENV klaida: NEXT_PUBLIC_ENCRYPTION_SECRET trūksta");
}

const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

const getKey = async () => {
  if (typeof window === "undefined") throw new Error("❌ getKey veikia tik naršyklėje");

  const baseKey = await crypto.subtle.importKey(
    "raw",
    encode(ENCRYPTION_SECRET),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
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

  return btoa(
    JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
    })
  );
};

export const decrypt = async (ciphertext) => {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(iv),
    },
    key,
    new Uint8Array(data)
  );

  return decode(decrypted);
};

export const isValidPrivateKey = (key) =>
  typeof key === "string" && /^0x[a-fA-F0-9]{64}$/.test(key.trim());

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

      toast.success("✅ Wallet sukurtas", {
        position: "top-center",
        autoClose: 3000,
      });
    },
    [setupWallet]
  );

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
        console.error("❌ Wallet įkėlimo klaida:", err.message);

        toast.error("❌ Wallet klaida", {
          position: "top-center",
          autoClose: 3000,
        });

        setWallet(null);
      } finally {
        setTimeout(() => {
          const isReady =
            wallet?.wallet && Object.keys(wallet?.signers || {}).length > 0;
          setWalletLoading(!isReady);
        }, 50);
      }
    },
    [createAndStoreWallet, setupWallet, wallet]
  );

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

  
