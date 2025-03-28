"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const MagicLinkContext = createContext();

export function MagicLinkProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ✅ Get current user from Supabase session
  useEffect(() => {
    const getUser = async () => {
      setLoadingUser(true);
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn("❌ Failed to fetch Supabase user:", error.message);
      }
      setUser(data?.user || null);
      setLoadingUser(false);
    };

    getUser();

    // ✅ Real-time listener for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // ✅ Magic Link sign-in
  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw new Error("Magic link error: " + error.message);
  };

  // ✅ Google OAuth login
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw new Error("Google login error: " + error.message);
  };

  // ✅ Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("Sign out error: " + error.message);
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
