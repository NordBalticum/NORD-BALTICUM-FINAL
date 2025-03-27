"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MagicLinkContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Load user session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("❌ Failed to initialize session:", error.message);
      } finally {
        setLoadingUser(false);
      }
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Magic Link (OTP) Login
  const signInWithEmail = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw new Error(error.message);
    } catch (error) {
      console.error("❌ Magic Link login error:", error.message);
      throw error;
    }
  };

  // Google OAuth Login
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw new Error(error.message);
    } catch (error) {
      console.error("❌ Google login error:", error.message);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem("userWallets");
    } catch (error) {
      console.error("❌ Logout error:", error.message);
    }
  };

  return (
    <MagicLinkContext.Provider
      value={{
        supabase,
        user,
        loadingUser,
        signInWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </MagicLinkContext.Provider>
  );
};

export const useMagicLink = () => useContext(MagicLinkContext);
