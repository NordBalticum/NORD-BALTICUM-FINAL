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

  useEffect(() => {
    if (user) {
      const existingWallet = loadWallet();
      if (existingWallet) {
        setWallet(existingWallet);
      } else {
        const newWallet = createAndSaveWallet();
        setWallet(newWallet);
      }
    }
  }, [user]);

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

const createAndSaveWallet = () => {
  const wallet = Wallet.createRandom();
  const walletData = {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
  localStorage.setItem("userWallet", JSON.stringify(walletData));
  return wallet;
};

const loadWallet = () => {
  const walletData = localStorage.getItem("userWallet");
  if (walletData) {
    const { privateKey } = JSON.parse(walletData);
    return new Wallet(privateKey);
  }
  return null;
};
