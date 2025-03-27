"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export const MagicLinkContext = createContext();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const MagicLinkProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biometricEmail, setBiometricEmail] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      const bioEmail = localStorage.getItem("biometric_user");
      if (bioEmail) setBiometricEmail(bioEmail);

      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        const bioEmail = localStorage.getItem("biometric_user");
        if (bioEmail) setBiometricEmail(bioEmail);
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) console.error("OTP Login Error:", error.message);
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) console.error("Google Login Error:", error.message);
  };

  const loginWithBiometrics = async () => {
    const bioEmail = localStorage.getItem("biometric_user");
    if (bioEmail) await signInWithEmail(bioEmail);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem("userWallet");
  };

  return (
    <MagicLinkContext.Provider
      value={{
        supabase,
        user,
        loading,
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
