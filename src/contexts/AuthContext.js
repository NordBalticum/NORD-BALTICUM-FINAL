"use client";

// =======================================
// 📦 IMPORTAI IR SISTEMINĖ BAZĖ
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
// 🔐 AES-GCM ŠIFRAVIMO SISTEMA
// =======================================

// Apsaugos slaptas raktas iš .env failo
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
if (!ENCRYPTION_SECRET && typeof window !== "undefined") {
  console.error("❌ Trūksta NEXT_PUBLIC_ENCRYPTION_SECRET .env faile");
}

// Pagalbinės funkcijos: tekstas <-> baitai
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

// Sugeneruoja AES raktą naudojant PBKDF2
const getKey = async () => {
  if (typeof window === "undefined") throw new Error("❌ AES key veikia tik naršyklėje");
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

// Užšifruoja tekstą (privatų raktą)
export const encrypt = async (text) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();
  const data = encode(text);
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return btoa(JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  }));
};

// Iššifruoja privatų raktą
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

// PrivKey formatas tikrinamas (0x + 64 hex simboliai)
export const isValidPrivateKey = (key) =>
  /^0x[a-fA-F0-9]{64}$/.test(key.trim());

// =======================================
// 🌐 AUTENTIFIKACIJOS KONTEKSTAS
// =======================================
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// =======================================
// 🧠 PAGRINDINIS AuthProvider
// =======================================
export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const isClient = typeof window !== "undefined";

  // Pagrindinės būsenos
  const [user, setUser] = useState(null);           // Supabase user info
  const [wallet, setWallet] = useState(null);       // Wallet + signeriai
  const [session, setSession] = useState(null);     // Supabase sesija
  const [authLoading, setAuthLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);

  const lastSessionRefresh = useRef(Date.now());    // Refresho laikmatis
  const inactivityTimer = useRef(null);             // Auto logout laikmatis

  // =======================================
  // 🧱 SETUP Wallet iš privKey + RPCs
  // =======================================
  const setupWallet = useCallback((privateKey) => {
    const base = new ethers.Wallet(privateKey);
    const signers = {};

    // Kiekvienam tinklui sukurti signerį
    for (const key in fallbackRPCs) {
      const net = fallbackRPCs[key];
      if (!net?.rpcs?.length) continue;

      try {
        const provider = new ethers.JsonRpcProvider(net.rpcs[0], net.chainId);
        signers[key] = new ethers.Wallet(privateKey, provider);
      } catch (err) {
        console.warn(`⚠️ ${net.label} provider nepavyko:`, err.message);
      }
    }

    setWallet({ wallet: base, signers });
  }, []);

  // =======================================
  // ✨ Sukuriam ir įrašom naują wallet
  // =======================================
  const createAndStoreWallet = useCallback(async (email) => {
    const newWallet = ethers.Wallet.createRandom(); // Generuoja naują wallet
    const encryptedKey = await encrypt(newWallet.privateKey); // Užšifruojam privKey

    const { error } = await supabase.from("wallets").upsert({
      user_email: email,
      eth_address: newWallet.address,
      encrypted_key: encryptedKey,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    setupWallet(newWallet.privateKey); // Inicijuojam signer'ius
    toast.success("✅ Naujas wallet sukurtas!", { position: "top-center", autoClose: 3000 });
  }, [setupWallet]);

  // =======================================
  // 💾 Įkeliam esamą wallet arba sukuriam naują
  // =======================================
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
      console.error("❌ Wallet klaida:", err.message);
      toast.error("❌ Wallet nepavyko", { position: "top-center", autoClose: 3000 });
      setWallet(null);
    } finally {
      setWalletLoading(false);
    }
  }, [createAndStoreWallet, setupWallet]);

  // =======================================
  // 🔓 Importas iš privKey
  // =======================================
  const importWalletFromPrivateKey = useCallback(async (email, privateKey) => {
    if (!isValidPrivateKey(privateKey)) {
      toast.error("❌ Neteisingas privatus raktas", { position: "top-center", autoClose: 3000 });
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
      toast.success("✅ Wallet importuotas!", { position: "top-center", autoClose: 3000 });
    } catch (err) {
      console.error("❌ Importo klaida:", err.message);
      toast.error("❌ Importo nepavyko", { position: "top-center", autoClose: 3000 });
    } finally {
      setWalletLoading(false);
    }
  }, [setupWallet]);

  // =======================================
  // 🔁 Refreshinam sesiją kas 60s
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
        setSession(null);
        setUser(null);
        setWallet(null);
      }
    } catch (err) {
      console.error("❌ Sesijos refresh klaida:", err.message);
      setSession(null);
      setUser(null);
      setWallet(null);
    }
  }, []);

  // =======================================
  // 🔑 Prisijungimas su MagicLink
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
  // 🚪 Atsijungimas – su redirect ir localStorage išvalymu
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
      ["userPrivateKey", "activeNetwork", "sessionData"].forEach(k =>
        localStorage.removeItem(k)
      );
    }

    router.replace(redirectPath);

    if (showToast) {
      toast.info("👋 Atsijungta", { position: "top-center", autoClose: 3000 });
    }
  }, [router, isClient]);

  // =======================================
  // 🧠 Pirmas useEffect – inicializuojam sesiją
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
        console.error("❌ Sesijos pradinė klaida:", err.message);
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
  // 🪝 useEffect: kraunam wallet jei turim userį
  // =======================================
  useEffect(() => {
    if (!isClient || authLoading || !user?.email) return;
    loadOrCreateWallet(user.email);
  }, [authLoading, user?.email, isClient, loadOrCreateWallet]);

  // =======================================
  // 👁️ useEffect: tabo fokusavimas – atnaujina sesiją
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
  // ⏱️ Inaktyvumo logout (15 min timeout)
  // =======================================
  useEffect(() => {
    if (!isClient) return;

    const events = ["mousemove", "keydown", "click", "touchstart"];
    const resetTimer = () => {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => signOut(true), 15 * 60 * 1000); // 15min
    };

    events.forEach(evt => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [signOut, isClient]);

  // =======================================
  // 🎯 Returninam Context Provider visiems vaikams
  // =======================================
  return (
    <AuthContext.Provider
      value={{
        user,                 // Supabase user objektas
        session,              // Dabartinė sesija
        wallet,               // Wallet objektas su signeriais (visi networkai)
        authLoading,          // Ar authetifikacija vis dar kraunasi
        walletLoading,        // Ar wallet dar generuojamas ar atkuriamas
        safeRefreshSession,   // Saugus sesijos atnaujinimas (kas 60s)
        signInWithMagicLink,  // Prisijungimas per Magic Link
        signInWithGoogle,     // Prisijungimas per Google OAuth
        signOut,              // Atsijungimo logika
        importWalletFromPrivateKey, // Importavimas iš rankinio privKey
        isValidPrivateKey,    // Validacijos helperis
      }}
    >
      {/* 👁️ Atvaizduojam children tik kai auth pilnai užsikrovęs */}
      {!authLoading && children}
    </AuthContext.Provider>
  );
};
