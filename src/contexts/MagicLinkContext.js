"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const MagicLinkContext = createContext();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const MagicLinkProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const intervalRef = useRef(null);

  // ✅ Inicijuojam sesiją ir pridedam automatinį tikrinimą kas 10 min
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (err) {
        console.error("❌ Session init error:", err?.message || err);
      } finally {
        setLoadingUser(false);
      }
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    // Kas 10min automatinis sesijos tikrinimas
    intervalRef.current = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.warn("⚠️ Session expired – auto logout.");
          setUser(null);
          localStorage.removeItem("userWallets");
          window.location.replace("/");
        }
      } catch (err) {
        console.error("❌ Session check error:", err?.message || err);
      }
    }, 600000); // 10 minutes

    return () => {
      listener?.subscription?.unsubscribe?.();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ✅ Magic Link (OTP) prisijungimas
  const signInWithEmail = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
    } catch (err) {
      console.error("❌ Magic Link error:", err?.message || err);
      throw err;
    }
  };

  // ✅ Google OAuth prisijungimas
  const loginWithGoogle = async () => {
  try {
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/dashboard`
        : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) throw error;
  } catch (err) {
    console.error("❌ Google login error:", err?.message || err);
    throw err;
  }
};
  
  // ✅ Logout
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      localStorage.removeItem("userWallets");
      window.location.replace("/");
    } catch (err) {
      console.error("❌ Logout failed:", err?.message || err);
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
