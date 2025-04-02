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
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Failed to get session:", error);
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await ensureWalletsExist(session.user.email);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Unexpected error fetching session:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUserSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        ensureWalletsExist(session.user.email);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const ensureWalletsExist = async (email) => {
    try {
      // Check if wallets exist for the user
      const { data: wallets, error } = await supabase
        .from("wallets")
        .select("bnb_address, tbnb_address, eth_address, matic_address, avax_address")
        .eq("email", email);

      if (error) {
        console.error("Error fetching wallets:", error);
        return;
      }

      // If no wallets found or any are missing, generate them
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
          .insert(walletData);

        if (insertError) {
          console.error("Error creating wallets:", insertError);
        }
      }
    } catch (err) {
      console.error("Unexpected error in ensureWalletsExist:", err);
    }
  };

  const signInWithMagicLink = async (email) => {
    try {
      if (!email) throw new Error("Email is required.");
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Error signing in with Magic Link:", err);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Error signing in with Google:", err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
    } catch (err) {
      console.error("Error signing out:", err);
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
    throw new Error("useMagicLink must be used within a MagicLinkProvider");
  }
  return context;
};
