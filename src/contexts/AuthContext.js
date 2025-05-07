"use client";

// =======================================
// 📦 Reikalingi importai
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
// 🔐 AES šifravimo konstantos ir funkcijos
// =======================================

// Apsaugos raktas iš .env
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
if (!ENCRYPTION_SECRET && typeof window !== "undefined") {
  console.error("❌ Trūksta NEXT_PUBLIC_ENCRYPTION_SECRET .env faile");
}

// Teksto kodavimas/atkoduojimas į Uint8Array
const encode = (str) => new TextEncoder().encode(str);
const decode = (buf) => new TextDecoder().decode(buf);

// Sugeneruoja AES raktą naudojant PBKDF2 algoritmą
const getKey = async () => {
  if (typeof window === "undefined") throw new Error("❌ getKey() veikia tik naršyklėje");
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

// Užšifruoja tekstą (privatų raktą) naudodamas AES-GCM
export const encrypt = async (text) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();
  const data = encode(text);
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return btoa(JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
};

// Iššifruoja užkoduotą AES tekstą
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

// Tikrina ar privatus raktas validus pagal 0x + 64 simboliai
export const isValidPrivateKey = (key) => /^0x[a-fA-F0-9]{64}$/.test(key.trim());

// =======================================
// 🌍 Konteksto kūrimas
// =======================================

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// =======================================
// 🔧 Pagrindinis AuthProvider komponentas
// =======================================

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const isClient = typeof window !== "undefined";

  // ✅ Reikalingos būsenos
  const [user, setUser] = useState(null); // Supabase user
  const [wallet, setWallet] = useState(null); // Lokalus ethers wallet
  const [session, setSession] = useState(null); // Supabase sesija
  const [authLoading, setAuthLoading] = useState(true); // Ar užkraunamas auth
  const [walletLoading, setWalletLoading] = useState(true); // Ar užkraunamas wallet

  const lastSessionRefresh = useRef(Date.now()); // Naudojama refresh timeout'ui
  const inactivityTimer = useRef(null); // Inaktyvumo laikmatis (auto logout)

  // =============================
  // 🔧 Inicijuojam wallet'ą ir signerius per fallbackRPCs
  // =============================
  const setupWallet = useCallback((privateKey) => {
    // Pagrindinis wallet objektas
    const base = new ethers.Wallet(privateKey);
    const signers = {};

    // Pereinam per visus fallbackRPCs (pvz., eth, bnb, matic, ir t.t.)
    for (const key in fallbackRPCs) {
      const net = fallbackRPCs[key];
      if (!net?.rpcs?.[0]) continue;

      try {
        const provider = new ethers.JsonRpcProvider(net.rpcs[0], net.chainId);
        signers[key] = new ethers.Wallet(privateKey, provider);
      } catch (err) {
        console.warn(`⚠️ RPC nepavyko ${net.label}:`, err);
      }
    }

    // Išsaugom wallet būseną
    setWallet({ wallet: base, signers });
  }, []);

  // =============================
  // ✨ Sukuriam naują wallet ir išsaugom Supabase
  // =============================
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
    toast.success("✅ Naujas wallet sukurtas!", { position: "top-center", autoClose: 3000 });
  }, [setupWallet]);

  // =============================
  // 💾 Įkeliam egzistuojantį wallet arba sukuriam naują
  // =============================
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
      console.error("❌ Nepavyko užkrauti ar sukurti wallet:", err);
      toast.error("❌ Wallet klaida", { position: "top-center", autoClose: 3000 });
      setWallet(null);
    } finally {
      setWalletLoading(false);
    }
  }, [createAndStoreWallet, setupWallet]);

  // =============================
  // 🔓 Importuojam wallet per privKey
  // =============================
  const importWalletFromPrivateKey = useCallback(async (email, privateKey) => {
    if (!isValidPrivateKey(privateKey)) {
      toast.error("❌ Neteisingas private key formatas", { position: "top-center", autoClose: 3000 });
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
      console.error("❌ Importo klaida:", err);
      toast.error("❌ Wallet import nepavyko", { position: "top-center", autoClose: 3000 });
    } finally {
      setWalletLoading(false);
    }
  }, [setupWallet]);

  // =============================
  // 🔁 Saugiai atnaujinam Supabase sesiją (kas 60s max)
  // =============================
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
      console.error("❌ Supabase sesijos atnaujinimo klaida:", err);
      setSession(null);
      setUser(null);
      setWallet(null);
    }
  }, []);

  // =============================
  // 🔑 Prisijungimas su MagicLink
  // =============================
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

  // =============================
  // 🔐 Prisijungimas su Google OAuth
  // =============================
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

  // =============================
  // 🚪 Atsijungimas – su localStorage cleanup ir redirect
  // =============================
  const signOut = useCallback(async (showToast = false, redirectPath = "/") => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("❌ Sign out klaida:", err);
    }

    // Valom visas būsenas
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

  // =============================
  // 🧠 useEffect: Pirmas kartas – Supabase sesijos įkėlimas
  // =============================
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
        console.error("❌ Sesijos pradinio įkėlimo klaida:", err);
      } finally {
        setAuthLoading(false);
      }
    })();

    // 🔄 Real-time prisijungimo būsena
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

  // =============================
  // 🔃 useEffect: Įkėlus user'į – automatiškai kraunam wallet
  // =============================
  useEffect(() => {
    if (!isClient || authLoading || !user?.email) return;
    loadOrCreateWallet(user.email);
  }, [authLoading, user?.email, isClient, loadOrCreateWallet]);

  // =============================
  // 👁️ useEffect: Kai user grįžta į tabą arba fokusuoja – atnaujink sesiją
  // =============================
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

  // =============================
  // ⏱️ useEffect: Auto logout po 15 min inaktyvumo
  // =============================
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

  // =============================
  // 🎯 Returninam Context Provider visiems vaikams
  // =============================
  return (
    <AuthContext.Provider
      value={{
        user, // Supabase user objektas
        session, // Sesijos duomenys
        wallet, // Wallet objektas su signeriais
        authLoading, // Ar kraunasi auth
        walletLoading, // Ar kraunasi wallet
        safeRefreshSession, // Saugus sesijos atnaujinimas
        signInWithMagicLink, // Prisijungimas per email
        signInWithGoogle, // Prisijungimas per Google OAuth
        signOut, // Atsijungimas
        importWalletFromPrivateKey, // Importas iš privKey
        isValidPrivateKey, // PrivKey validatorius
      }}
    >
      {/* 👁️ Vaikų komponentai rodomi tik kai auth baigė krautis */}
      {!authLoading && children}
    </AuthContext.Provider>
  );
};
