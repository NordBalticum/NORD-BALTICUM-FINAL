"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const MagicLinkContext = createContext();

export function MagicLinkProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch current user session on load
  useEffect(() => {
    const getUser = async () => {
      setLoadingUser(true);
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn("❌ Failed to get user:", error.message);
      }
      setUser(data?.user || null);
      setLoadingUser(false);
    };

    getUser();

    // Real-time listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Sign in via Magic Link (Email)
  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) throw new Error("Magic link failed: " + error.message);
  };

  // Google OAuth Login
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) throw new Error("Google sign-in failed: " + error.message);
  };

  // Sign Out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("Sign out failed: " + error.message);
    setUser(null);
  };

  return (
    <MagicLinkContext.Provider
      value={{
        user,
        loadingUser,
        signInWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </MagicLinkContext.Provider>
  );
}

export const useMagicLink = () => useContext(MagicLinkContext);
