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

  // ✅ Inicijuojam sesiją ir onAuthStateChange
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

    // ✅ Kas 10 min tikrina sesiją
    intervalRef.current = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.warn("⚠️ Session expired – auto logout");
          await logout();
        }
      } catch (err) {
        console.error("❌ Periodic session check error:", err?.message || err);
      }
    }, 600000); // kas 10 min

    return () => {
      listener?.subscription?.unsubscribe?.();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ✅ Prisijungimas su MagicLink
  const signInWithEmail = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: "https://nordbalticum.com/dashboard",
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("❌ Magic Link error:", err?.message || err);
      throw err;
    }
  };

  // ✅ Prisijungimas su Google
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          emailRedirectTo: "https://nordbalticum.com/dashboard"
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("❌ Google login error:", err?.message || err);
      throw err;
    }
  };

  // ✅ Logout (premium)
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
