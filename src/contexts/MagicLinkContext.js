"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "@/utils/supabaseClient";
import { ethers } from "ethers";

// Create a context for managing Magic Link authentication
const MagicLinkContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  // State variables for user session and loading state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the current user session upon component mount
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Failed to retrieve session:", error);
          setUser(null);
        } else {
          setUser(session?.user || null);
          if (session?.user) {
            // Ensure wallets exist for the authenticated user
            await ensureUserWallets(session.user.email);
          }
        }
      } catch (err) {
        console.error("Unexpected error during session retrieval:", err);
      } finally {
        setLoading(false);
      }
    };

    // Run the session fetch on component mount
    fetchSession();

    // Listen for authentication state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        ensureUserWallets(session.user.email);
      }
    });

    // Cleanup the subscription on component unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Ensure that wallets exist for a given email address.
   * If they do not, generate new wallets and store them in the database.
   * @param {string} email - The user's email address.
   */
  const ensureUserWallets = async (email) => {
    try {
      const { data: wallets, error } = await supabase
        .from("wallets")
        .select("bnb_address, tbnb_address, eth_address, matic_address, avax_address")
        .eq("email", email);

      if (error) {
        console.error("Error checking wallets:", error);
        return;
      }

      if (!wallets.length || wallets.some(wallet => !wallet.bnb_address || !wallet.tbnb_address || !wallet.eth_address || !wallet.matic_address || !wallet.avax_address)) {
        const newWallet = ethers.Wallet.createRandom();
        const walletData = {
          email,
          bnb_address: newWallet.address,
          tbnb_address: newWallet.address,
          eth_address: newWallet.address,
          matic_address: newWallet.address,
          avax_address: newWallet.address,
        };

        const { error: insertError } = await supabase
          .from("wallets")
          .upsert(walletData, { onConflict: "email" });

        if (insertError) {
          console.error("Error creating wallets:", insertError);
        }
      }
    } catch (err) {
      console.error("Unexpected error while ensuring wallets exist:", err);
    }
  };

  /**
   * Fetch wallet information for a specific user email.
   * @param {string} email - The user's email address.
   * @returns {Promise<object|null>} - Wallet data or null if an error occurs.
   */
  const fetchUserWallet = async (email) => {
    try {
      const { data: wallet, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        console.error("Error fetching wallet:", error);
        return null;
      }

      return wallet;
    } catch (err) {
      console.error("Unexpected error while fetching wallet:", err);
      return null;
    }
  };

  /**
   * Send a Magic Link to a user's email for authentication.
   * @param {string} email - The user's email address.
   * @throws Will throw an error if the email is invalid or the operation fails.
   */
  const signInWithMagicLink = async (email) => {
    if (!email) {
      throw new Error("An email address is required.");
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        console.error("Error sending Magic Link:", error);
        throw error;
      }
    } catch (err) {
      console.error("Unexpected error during Magic Link sign-in:", err);
      throw err;
    }
  };

  /**
   * Initiate Google OAuth sign-in.
   * @throws Will throw an error if the operation fails.
   */
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) {
        console.error("Error signing in with Google:", error);
        throw error;
      }
    } catch (err) {
      console.error("Unexpected error during Google sign-in:", err);
      throw err;
    }
  };

  /**
   * Sign out the current user.
   * @throws Will throw an error if the operation fails.
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        throw error;
      }

      setUser(null);
    } catch (err) {
      console.error("Unexpected error during sign-out:", err);
      throw err;
    }
  };

  // Provide the context value to child components
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

// Custom hook for using the Magic Link context
export const useMagicLink = () => {
  const context = useContext(MagicLinkContext);
  if (!context) {
    throw new Error("useMagicLink must be used within a MagicLinkProvider.");
  }

  return context;
};
