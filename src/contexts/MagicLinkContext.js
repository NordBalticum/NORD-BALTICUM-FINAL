import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Wallet } from "ethers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MagicLinkContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  // STEP 1 – Get Supabase session & subscribe to auth changes
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // STEP 2 – Load or create wallet
  useEffect(() => {
    if (user) {
      loadOrCreateWallet(user.id);
    }
  }, [user]);

  const loadOrCreateWallet = async (user_id) => {
    const { data: existing } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (existing) {
      setWallet(existing);
    } else {
      const newWallet = Wallet.createRandom();
      const walletData = {
        user_id,
        address: newWallet.address,
        private_key: newWallet.privateKey,
        network: "bsc",
      };
      const { error: insertError } = await supabase
        .from("wallets")
        .insert(walletData);

      if (!insertError) setWallet(walletData);
      else console.error("Wallet creation error:", insertError);
    }
  };

  // STEP 3 – Session refresh kas 1 minutę
  useEffect(() => {
    const interval = setInterval(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        await signOut();
      } else {
        setUser(session.user);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // STEP 4 – Auto logout po 10 min AFK
  useEffect(() => {
    let lastActivity = Date.now();

    const resetTimer = () => {
      lastActivity = Date.now();
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    const interval = setInterval(async () => {
      const now = Date.now();
      const minutesInactive = (now - lastActivity) / 60000;

      if (minutesInactive >= 10) {
        await signOut();
      }
    }, 60000);

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      clearInterval(interval);
    };
  }, []);

  // STEP 5 – Auth functions
  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWallet(null);
  };

  return (
    <MagicLinkContext.Provider
      value={{ user, wallet, signInWithEmail, signOut, supabase }}
    >
      {!loading && children}
    </MagicLinkContext.Provider>
  );
};

export const useMagicLink = () => useContext(MagicLinkContext);
