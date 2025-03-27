"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useMagicLink } from "./MagicLinkContext";
import { useWalletLoad } from "./WalletLoadContext";
import { useBalance } from "./BalanceContext";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const {
    user,
    loadingUser,
    biometricEmail,
    signInWithEmail,
    loginWithGoogle,
    loginWithBiometrics,
    logout,
  } = useMagicLink();

  const { wallets, loadingWallets } = useWalletLoad();
  const {
    balances,
    loading: loadingBalances,
    refreshBalances,
  } = useBalance();

  const [sessionReady, setSessionReady] = useState(false);
  const [autoLoginTried, setAutoLoginTried] = useState(false);

  // ✅ Automatinis WebAuthn fallback login
  useEffect(() => {
    const attemptBiometricAutoLogin = async () => {
      if (!user && biometricEmail && !autoLoginTried) {
        setAutoLoginTried(true);
        try {
          await signInWithEmail(biometricEmail);
        } catch (err) {
          console.warn("Biometric fallback failed:", err);
        }
      }
    };
    attemptBiometricAutoLogin();
  }, [user, biometricEmail, autoLoginTried]);

  // ✅ Sesijos monitoringas realiu laiku
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          console.warn("⚠️ Sesija baigta. Vartotojas atsijungė.");
          alert("Jūsų sesija baigėsi. Prašome prisijungti iš naujo.");
          logout();
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }

        if (event === "SIGNED_IN" && session?.user) {
          console.log("✅ Nauja sesija aptikta – balansas atnaujinamas.");
          await refreshBalances();
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [refreshBalances, logout]);

  // ✅ Visos sistemos ready flag
  useEffect(() => {
    if (!loadingUser && !loadingWallets && !loadingBalances && user && wallets) {
      setSessionReady(true);
    } else {
      setSessionReady(false);
    }
  }, [loadingUser, loadingWallets, loadingBalances, user, wallets]);

  return (
    <AuthContext.Provider
      value={{
        supabase,
        user,
        wallet: wallets,
        balances,
        biometricEmail,
        sessionReady,
        loadingUser,
        loadingWallets,
        loadingBalances,
        signInWithEmail,
        loginWithGoogle,
        loginWithBiometrics,
        logout,
        refreshBalances,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
