"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export const MagicLinkContext = createContext();

// === Supabase klientas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const MagicLinkProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [biometricEmail, setBiometricEmail] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // === Inicializuojam sesiją ir biometrinį email
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user || null;
        setUser(currentUser);

        const storedBio = localStorage.getItem("biometric_user");
        if (storedBio) setBiometricEmail(storedBio);
      } catch (err) {
        console.error("❌ Init error:", err.message);
      } finally {
        setLoadingUser(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
        const storedBio = localStorage.getItem("biometric_user");
        if (storedBio) setBiometricEmail(storedBio);
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
      localStorage.setItem("biometric_user", email);
      setBiometricEmail(email);
    } catch (err) {
      console.error("❌ OTP Login Error:", err.message);
    }
  };

  // === Google OAuth login
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) throw new Error(error.message);
    } catch (err) {
      console.error("❌ Google Login Error:", err.message);
    }
  };

  // === Biometrinis login per išsaugotą email
  const loginWithBiometrics = async () => {
    try {
      const email = localStorage.getItem("biometric_user");
      if (!email) throw new Error("No biometric email saved.");
      await signInWithEmail(email);
    } catch (err) {
      console.error("❌ Biometric login error:", err.message);
    }
  };

  // === Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem("biometric_user");
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
        biometricEmail,
        signInWithEmail,
        loginWithGoogle,
        loginWithBiometrics,
        logout,
      }}
    >
      {children}
    </MagicLinkContext.Provider>
  );
};

export const useMagicLink = () => useContext(MagicLinkContext);
