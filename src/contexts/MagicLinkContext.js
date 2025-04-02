"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

const MagicLinkContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Pradinis user fetch
  useEffect(() => {
    const getUser = async () => {
      setLoadingUser(true);
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ Session fetch error:", error.message);
        setUser(null);
        setLoadingUser(false);
        return;
      }

      if (data?.session?.user) {
        setUser(data.session.user);
      } else {
        setUser(null);
      }

      setLoadingUser(false);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email) => {
    setLoadingUser(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) console.error("MagicLink error:", error.message);
    setLoadingUser(false);
  };

  const loginWithGoogle = async () => {
    setLoadingUser(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) console.error("Google login error:", error.message);
    setLoadingUser(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.replace("/");
  };

  return (
    <MagicLinkContext.Provider
      value={{
        user,
        loading: loadingUser,
        loginWithEmail,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </MagicLinkContext.Provider>
  );
};

export const useMagicLink = () => useContext(MagicLinkContext);
