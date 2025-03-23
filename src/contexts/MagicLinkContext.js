"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@supabase/supabase-js";
import { Wallet } from "ethers";
import dynamic from "next/dynamic";

// ✅ Supabase init
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MagicLinkContext = createContext();

const MagicLinkProviderBase = ({ children, router }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ 1. Redirect jei nėra user
  useEffect(() => {
    if (!loading && !user && router?.isReady && router.pathname !== "/") {
      router.push("/");
    }
  }, [user, loading, router]);

  // ✅ 2. Gauna sesiją + listener
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("❌ Session fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription?.unsubscribe?.();
  }, []);

  // ✅ 3. Užkrauna arba sukuria wallet
  useEffect(() => {
    if (user?.id) {
      loadOrCreateWallet(user.id);
    }
  }, [user]);

  const loadOrCreateWallet = useCallback(async (user_id) => {
    try {
      const { data: existing, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user_id)
        .single();

      if (existing && !error) {
        setWallet(existing);
      } else {
        const newWallet = Wallet.createRandom();
        const walletData = {
          user_id,
          address: newWallet.address,
          private_key: newWallet.privateKey,
          network: "bscTestnet",
        };

        const { error: insertError } = await supabase
          .from("wallets")
          .insert(walletData);

        if (!insertError) {
          setWallet(walletData);
        }

        // ✅ Balanso lentelė irgi sukuriama
        await supabase.from("balances").upsert({
          user_id,
          network: walletData.network,
          balance_raw: "0",
          balance_formatted: "0.0000"
        });
      }
    } catch (err) {
      console.error("❌ Wallet create/load error:", err);
    }
  }, []);

  // ✅ 4. Sesijos atnaujinimas kas 60s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) await signOut();
        else setUser(session.user);
      } catch (err) {
        console.error("❌ Session refresh failed:", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // ✅ 5. AFK Logout po 10min
  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastActivity = Date.now();
    const reset = () => (lastActivity = Date.now());

    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);

    const afk = setInterval(() => {
      const diff = (Date.now() - lastActivity) / 60000;
      if (diff >= 10) signOut();
    }, 60000);

    return () => {
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
      clearInterval(afk);
    };
  }, []);

  // ✅ 6. Magic Link prisijungimas
  const signInWithEmail = useCallback(async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `https://nordbalticum.com/dashboard`,
        },
      });
      if (error) throw error;
      console.log("✅ Magic Link sent!");
    } catch (err) {
      console.error("❌ Magic Link error:", err.message);
      throw err;
    }
  }, []);

  // ✅ 7. Logout
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("❌ Logout failed:", err);
    } finally {
      setUser(null);
      setWallet(null);
    }
  }, []);

  return (
    <MagicLinkContext.Provider
      value={{ user, wallet, signInWithEmail, signOut, supabase }}
    >
      {!loading && children}
    </MagicLinkContext.Provider>
  );
};

// ✅ Wrapper – dynamic su Next router
const MagicLinkWrapper = ({ children }) => {
  const router = require("next/router").useRouter();
  return (
    <MagicLinkProviderBase router={router}>{children}</MagicLinkProviderBase>
  );
};

export const MagicLinkProvider = dynamic(
  () => Promise.resolve(MagicLinkWrapper),
  { ssr: false }
);

export const useMagicLink = () => useContext(MagicLinkContext);
