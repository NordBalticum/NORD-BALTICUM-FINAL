"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useMagicLink } from "./MagicLinkContext";
import { useWalletLoad } from "./WalletLoadContext";
import { useBalance } from "./BalanceContext";

// Create Supabase client
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
  const { balances, loading: loadingBalances, refreshBalances } = useBalance();

  const [sessionReady, setSessionReady] = useState(false);
  const [wasLoggedIn, setWasLoggedIn] = useState(false);

  // Real-time session monitoring
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const isOnRootPage = window.location.pathname === "/";

        if (event === "SIGNED_OUT" || !session?.user) {
          console.warn("Session expired or user signed out.");

          if (wasLoggedIn) {
            alert("Your session has ended. Please sign in again.");
            await logout();
            if (!isOnRootPage) window.location.href = "/";
          }
        }

        if (event === "SIGNED_IN" && session?.user) {
          console.log("New session detected. Refreshing balances...");
          await refreshBalances?.();
          setWasLoggedIn(true);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [logout, refreshBalances, wasLoggedIn]);

  // Set `sessionReady` when all required data is loaded
  useEffect(() => {
    const isReady =
      !loadingUser &&
      !loadingWallets &&
      !loadingBalances &&
      user &&
      wallets;
    setSessionReady(isReady);
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
