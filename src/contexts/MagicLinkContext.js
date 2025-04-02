"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";

const MagicLinkContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserSession = async () => {
      try {
        // Gauk sesijos informaciją iš Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Sesijos užkrovimas nepavyko:", error);
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          // Užtikrink, kad vartotojo piniginės egzistuoja
          await ensureWalletsExist(session.user.email);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Netikėta klaida užkrovus sesiją:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUserSession();

    // Prenumeruok sesijos pokyčius
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        ensureWalletsExist(session.user.email);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const ensureWalletsExist = async (email) => {
    try {
      // Patikrink, ar vartotojo piniginės jau egzistuoja
      const { data: wallets, error } = await supabase
        .from("wallets")
        .select("bnb_address, tbnb_address, eth_address, matic_address, avax_address")
        .eq("email", email);

      if (error) {
        console.error("Klaida tikrinant pinigines:", error);
        return;
      }

      // Jei piniginės neegzistuoja arba nėra pilnos, sukurk jas
      if (!wallets.length || wallets.some(wallet => !wallet.bnb_address || !wallet.tbnb_address || !wallet.eth_address || !wallet.matic_address || !wallet.avax_address)) {
        const wallet = ethers.Wallet.createRandom();
        const walletData = {
          email,
          bnb_address: wallet.address,
          tbnb_address: wallet.address,
          eth_address: wallet.address,
          matic_address: wallet.address,
          avax_address: wallet.address
        };

        const { error: insertError } = await supabase
          .from("wallets")
          .upsert(walletData, { onConflict: "email" });

        if (insertError) {
          console.error("Klaida kuriant pinigines:", insertError);
        }
      }
    } catch (err) {
      console.error("Netikėta klaida tikrinant ar kuriant pinigines:", err);
    }
  };

  const signInWithMagicLink = async (email) => {
    try {
      if (!email) throw new Error("El. paštas yra būtinas.");
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    } catch (err) {
      console.error("Klaida prisijungiant su Magic Link:", err);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) throw error;
    } catch (err) {
      console.error("Klaida prisijungiant su Google:", err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      console.error("Klaida atsijungiant:", err);
      throw err;
    }
  };

  return (
    <MagicLinkContext.Provider
      value={{
        user,
        loading,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </MagicLinkContext.Provider>
  );
};

export const useMagicLink = () => {
  const context = useContext(MagicLinkContext);
  if (!context) {
    throw new Error("useMagicLink turi būti naudojamas su MagicLinkProvider.");
  }
  return context;
};
