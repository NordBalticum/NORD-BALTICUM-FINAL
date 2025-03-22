import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Wallet } from "ethers";
import dynamic from "next/dynamic";

// Supabase init
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MagicLinkContext = createContext();

const MagicLinkProviderBase = ({ children, router }) => {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  // STEP 0 – Redirect į / jei nėra sesijos (tik jei ne jau index puslapyje)
  useEffect(() => {
    if (!loading && !user && router?.pathname !== "/") {
      router.push("/");
    }
  }, [user, loading, router]);

  // STEP 1 – Gauti sesiją ir subscribe pokyčiams
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription?.unsubscribe?.();
  }, []);

  // STEP 2 – Sukurti ar gauti wallet
  useEffect(() => {
    if (user) loadOrCreateWallet(user.id);
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
      const { error } = await supabase.from("wallets").insert(walletData);
      if (!error) setWallet(walletData);
    }
  };

  // STEP 3 – Kas 60s tikrinti ar sesija galiojanti
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) await signOut();
      else setUser(session.user);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // STEP 4 – AFK logout po 10 min
  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastActivity = Date.now();
    const resetTimer = () => (lastActivity = Date.now());

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    const interval = setInterval(() => {
      const now = Date.now();
      const inactive = (now - lastActivity) / 60000;
      if (inactive >= 10) signOut();
    }, 60000);

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      clearInterval(interval);
    };
  }, []);

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
    <MagicLinkContext.Provider value={{ user, wallet, signInWithEmail, signOut, supabase }}>
      {!loading && children}
    </MagicLinkContext.Provider>
  );
};

// NAUDOJAM DINAMINĮ RENDER TIK NARŠYKLĖJE
const MagicLinkWrapper = ({ children }) => {
  const router = require("next/router").useRouter(); // dynamic import
  return <MagicLinkProviderBase router={router}>{children}</MagicLinkProviderBase>;
};

export const MagicLinkProvider = dynamic(() => Promise.resolve(MagicLinkWrapper), {
  ssr: false,
});

export const useMagicLink = () => useContext(MagicLinkContext);
