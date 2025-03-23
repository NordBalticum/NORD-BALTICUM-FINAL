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

// ✅ Supabase Init (naudojamas TIK autentifikacijai)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MagicLinkContext = createContext();

const MagicLinkProviderBase = ({ children, router }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Autentifikacija ir sesijos valdymas
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription?.unsubscribe?.();
  }, []);

  // ✅ AFK logout (po 10 min)
  useEffect(() => {
    let lastActivity = Date.now();
    const reset = () => (lastActivity = Date.now());

    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);

    const afkCheck = setInterval(() => {
      if ((Date.now() - lastActivity) / 60000 >= 10) signOut();
    }, 60000);

    return () => {
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
      clearInterval(afkCheck);
    };
  }, []);

  // ✅ Wallet sugeneravimas tik jei neegzistuoja
  useEffect(() => {
    if (!user || wallet) return;

    (async () => {
      try {
        const { data: existing } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (existing?.address && existing?.private_key) {
          setWallet(existing);
        } else {
          const newWallet = Wallet.createRandom();
          const walletData = {
            user_id: user.id,
            address: newWallet.address,
            private_key: newWallet.privateKey,
          };

          await supabase.from("wallets").insert(walletData);
          setWallet(walletData);
        }
      } catch (err) {
        console.error("❌ Wallet init error:", err);
      }
    })();
  }, [user, wallet]);

  // ✅ Magic Link el. pašto siuntimas
  const signInWithEmail = useCallback(async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("❌ Magic Link error:", err.message);
      throw err;
    }
  }, []);

  // ✅ Logout
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
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

// ✅ Wrapper for Next.js
const MagicLinkWrapper = ({ children }) => {
  const router = require("next/router").useRouter();
  return <MagicLinkProviderBase router={router}>{children}</MagicLinkProviderBase>;
};

export const MagicLinkProvider = dynamic(
  () => Promise.resolve(MagicLinkWrapper),
  { ssr: false }
);

export const useMagicLink = () => useContext(MagicLinkContext);
