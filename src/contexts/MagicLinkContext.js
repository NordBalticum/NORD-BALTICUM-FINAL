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

// ✅ Supabase klientas
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MagicLinkContext = createContext();

const MagicLinkProviderBase = ({ children, router }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Redirect jei nėra user
  useEffect(() => {
    if (!loading && !user && router?.isReady && router.pathname !== "/") {
      router.push("/");
    }
  }, [user, loading, router]);

  // ✅ Gauti sesiją ir listener
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();
    setLoading(false);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe?.();
  }, []);

  // ✅ Pakrauna wallet iš DB arba sukuria
  useEffect(() => {
    if (user?.id) loadOrCreateWallet(user.id);
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
          network: "bsc",
        };
        const { error: insertError } = await supabase.from("wallets").insert(walletData);
        if (!insertError) setWallet(walletData);
      }
    } catch (err) {
      console.error("❌ Wallet load/create error:", err);
    }
  }, []);

  // ✅ AFK logout po 10min
  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastActivity = Date.now();
    const resetTimer = () => (lastActivity = Date.now());

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    const interval = setInterval(() => {
      const inactiveTime = (Date.now() - lastActivity) / 60000;
      if (inactiveTime >= 10) signOut();
    }, 60000);

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      clearInterval(interval);
    };
  }, []);

  // ✅ Magic Link – instant, garantuotas, su fallback URL
  const signInWithEmail = useCallback(async (email) => {
    try {
      const redirectUrl = `${window?.location?.origin || "https://nordbalticum.com"}/dashboard`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;
      console.log("✅ Magic Link sent to:", email);
    } catch (err) {
      console.error("❌ Magic Link error:", err.message);
      throw err;
    }
  }, []);

  // ✅ Logout
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("❌ Sign out failed:", err);
    } finally {
      setUser(null);
      setWallet(null);
    }
  }, []);

  return (
    <MagicLinkContext.Provider value={{ user, wallet, signInWithEmail, signOut, supabase }}>
      {!loading && children}
    </MagicLinkContext.Provider>
  );
};

// ✅ Dynamic wrapper
const MagicLinkWrapper = ({ children }) => {
  const router = require("next/router").useRouter();
  return <MagicLinkProviderBase router={router}>{children}</MagicLinkProviderBase>;
};

export const MagicLinkProvider = dynamic(() => Promise.resolve(MagicLinkWrapper), { ssr: false });
export const useMagicLink = () => useContext(MagicLinkContext);
