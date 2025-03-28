"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { createClient } from "@supabase/supabase-js";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWalletLoad } from "@/contexts/WalletLoadContext";
import { useBalance } from "@/contexts/BalanceContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const {
    user,
    loadingUser,
    signInWithEmail,
    loginWithGoogle,
    logout,
  } = useMagicLink();

  const { wallets, loadingWallets } = useWalletLoad();
  const {
    balances,
    loading: loadingBalances,
    refreshBalances,
  } = useBalance();

  const [sessionReady, setSessionReady] = useState(false);
  const wasLoggedInRef = useRef(false);

  // ✅ Reaguojam į Supabase AUTH įvykius
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const isRoot = typeof window !== "undefined" && window.location.pathname === "/";

        if (event === "SIGNED_OUT" || !session?.user) {
          console.warn("⚠️ Session ended or user signed out.");
          localStorage.removeItem("userWallets");
          wasLoggedInRef.current = false;

          if (!isRoot) {
            window.location.replace("/");
          }
          return;
        }

        if (event === "SIGNED_IN" && session?.user) {
          console.log("✅ Session active. Refreshing balances...");
          wasLoggedInRef.current = true;
          await refreshBalances?.();
        }
      }
    );

    return () => subscription?.unsubscribe?.();
  }, [refreshBalances]);

  // ✅ Automatinis sesijos readiness nustatymas
  useEffect(() => {
    const ready =
      !loadingUser &&
      !loadingWallets &&
      !loadingBalances &&
      !!user &&
      !!wallets;

    setSessionReady(ready);
  }, [loadingUser, loadingWallets, loadingBalances, user, wallets]);

  return (
    <AuthContext.Provider
      value={{
        supabase,
        user,
        wallet: wallets,
        balances,
        sessionReady,
        loadingUser,
        loadingWallets,
        loadingBalances,
        signInWithEmail,
        loginWithGoogle,
        logout,
        refreshBalances,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
