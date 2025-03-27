"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// === Supabase klientas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const MagicLinkContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // === Inicializuojam naudotoją
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (err) {
        console.error("❌ Session init error:", err.message);
      } finally {
        setLoadingUser(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // === OTP login
  const signInWithEmail = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw new Error(error.message);
    } catch (err) {
      console.error("❌ Magic Link login error:", err.message);
      throw err;
    }
  };

  // === Google OAuth login
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) throw new Error(error.message);
    } catch (err) {
      console.error("❌ Google login error:", err.message);
      throw err;
    }
  };

  // === Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem("userWallets");
    } catch (err) {
      console.error("❌ Logout error:", err.message);
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
