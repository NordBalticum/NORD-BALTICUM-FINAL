"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

const MagicLinkContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const loginWithEmail = async (email) => {
    await supabase.auth.signInWithOtp({ email });
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <MagicLinkContext.Provider value={{ user, loading, loginWithEmail, loginWithGoogle, logout }}>
      {children}
    </MagicLinkContext.Provider>
  );
};

export const useMagicLink = () => useContext(MagicLinkContext);
