"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const MagicLinkContext = createContext();

export function MagicLinkProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Initial session fetch & real-time auth state listener
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.warn("❌ Error fetching user:", error.message);
      }

      setUser(user || null);
      setLoading(false);
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // ✅ Sign in via Magic Link (OTP)
  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      throw new Error("Magic Link error: " + error.message);
    }
  };

  // ✅ Sign in via Google OAuth
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      throw new Error("Google login error: " + error.message);
    }
  };

  // ✅ Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error("Logout error: " + error.message);
    }
    setUser(null);
  };

  return (
    <MagicLinkContext.Provider
      value={{
        user,
        loadingUser: loading,
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
