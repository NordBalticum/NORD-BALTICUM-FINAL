"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export const MagicLinkContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef(null);

  // 1️⃣ Load current session on mount
  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Supabase session error:", error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  // 2️⃣ Auto redirect to /dashboard if already logged in
  useEffect(() => {
    if (typeof window !== "undefined" && !loading && user && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [user, loading, pathname, router]);

  // 3️⃣ Inactivity auto-logout
  useEffect(() => {
    if (typeof window === "undefined") return;

    const resetTimer = () => {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        signOut();
      }, 10 * 60 * 1000); // 10 minutes
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    resetTimer(); // initial run

    return () => {
      clearTimeout(inactivityTimer.current);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, []);

  // 4️⃣ Magic Link login
  const signInWithMagicLink = async (email) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://nordbalticum.com";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/dashboard`,
      },
    });

    if (error) throw error;
  };

  // 5️⃣ Google OAuth login
  const signInWithGoogle = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://nordbalticum.com";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/dashboard`,
      },
    });

    if (error) throw error;
  };

  // 6️⃣ Logout
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Sign out error:", error.message);
    } catch (err) {
      console.warn("Logout exception:", err);
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        router.replace("/");
      }
    }
  };

  return (
    <MagicLinkContext.Provider
      value={{
        user,
        loading,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </MagicLinkContext.Provider>
  );
};

export const useMagicLink = () => useContext(MagicLinkContext);
