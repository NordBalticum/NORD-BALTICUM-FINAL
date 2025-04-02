"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";

const MagicLinkContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw new Error("Failed to fetch session: " + error.message);
        setUser(session?.user || null);

        if (session?.user) {
          await ensureWalletsForAllNetworks(session.user.email);
          router.push("/dashboard"); // Route to dashboard upon successful sign-in
        }
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          await ensureWalletsForAllNetworks(session.user.email);
          router.push("/dashboard"); // Route to dashboard upon successful sign-in
        } else {
          router.push("/"); // Route to home page if logged out
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  const ensureWalletsForAllNetworks = async (email) => {
    try {
      const { data: wallet, error } = await supabase
        .from("wallets")
        .select("bnb_address, eth_address, matic_address, avax_address")
        .eq("email", email)
        .single();

      if (error && error.details.includes("No rows found")) {
        const newWallet = ethers.Wallet.createRandom();
        const walletData = {
          email,
          bnb_address: newWallet.address,
          eth_address: ethers.Wallet.createRandom().address,
          matic_address: ethers.Wallet.createRandom().address,
          avax_address: ethers.Wallet.createRandom().address,
        };

        const { error: insertError } = await supabase
          .from("wallets")
          .upsert(walletData, { onConflict: "email" });

        if (insertError) throw new Error("Error creating wallet for all networks: " + insertError.message);
      }
    } catch (error) {
      console.error("Error ensuring wallets for all networks:", error.message);
    }
  };

  const fetchUserWallet = async (email) => {
    try {
      const { data: wallet, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("email", email)
        .single();

      if (error) throw new Error("Error fetching wallet: " + error.message);
      return wallet;
    } catch (error) {
      console.error("Error fetching wallet:", error.message);
      return null;
    }
  };

  const signInWithMagicLink = async (email) => {
    try {
      if (!email) throw new Error("Email is required.");
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with Magic Link:", error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with Google:", error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      router.push("/"); // Route to home page after sign-out
    } catch (error) {
      console.error("Error signing out:", error.message);
      throw error;
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
        fetchUserWallet,
      }}
    >
      {children}
    </MagicLinkContext.Provider>
  );
};

export const useMagicLink = () => {
  const context = useContext(MagicLinkContext);
  if (!context) throw new Error("useMagicLink must be used within a MagicLinkProvider.");
  return context;
};
