"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { createClient } from "@supabase/supabase-js";

// Kontekstas
const MagicLinkContext = createContext();

// Supabase klientas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const MagicLinkProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const intervalRef = useRef(null);

  // ✅ Pradinis sesijos gavimas + realtime listener
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

    // ✅ Kas 10 min automatinis sesijos patikrinimas
    intervalRef.current = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.warn("⚠️ Session expired – auto logout");
          await logout(true);
        }
      } catch (err) {
        console.error("❌ Periodic session check error:", err?.message || err);
      }
    }, 600000); // kas 10 min

    return () => {
      listener?.subscription?.unsubscribe?.();
      clearInterval(intervalRef.current);
    };
  }, []);

  // ✅ Prisijungimas su Magic Link (OTP)
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
      console.error("❌ Magic Link sign-in error:", err?.message || err);
      throw err;
    }
  };

  // ✅ Prisijungimas su Google OAuth
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          shouldCreateUser: true,
          redirectTo: "https://nordbalticum.com/dashboard",
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("❌ Google login error:", err?.message || err);
      throw err;
    }
  };

  // ✅ Logout su optional silent režimu
  const logout = async (silent = false) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      localStorage.removeItem("userWallets");

      if (!silent) {
        window.location.replace("/");
      }
    } catch (err) {
      console.error("❌ Logout error:", err?.message || err);
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
