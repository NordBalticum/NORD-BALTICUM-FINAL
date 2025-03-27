"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useMagicLink } from "./MagicLinkContext";
import { useWalletLoad } from "./WalletLoadContext";
import { useBalance } from "./BalanceContext";

const AuthContext = createContext();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
  const [wasLoggedIn, setWasLoggedIn] = useState(false);

  // ✅ 1. Automatinis WebAuthn fallback (vieną kartą)
  useEffect(() => {
    const tryAutoLogin = async () => {
      if (!user && biometricEmail && !autoLoginTried) {
        setAutoLoginTried(true);
        try {
          await signInWithEmail(biometricEmail);
          console.log("✅ Biometric fallback success");
        } catch (err) {
          console.warn("❌ Biometric fallback failed:", err);
        }
      }
    };
    tryAutoLogin();
  }, [user, biometricEmail, autoLoginTried]);

  // ✅ 2. Sesijos monitoringas realiu laiku
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const onRoot = window.location.pathname === "/";

        if (event === "SIGNED_OUT" || !session?.user) {
          console.warn("⚠️ Sesija baigėsi.");

          if (wasLoggedIn) {
            alert("Jūsų sesija baigėsi. Prašome prisijungti iš naujo.");
            await logout();
            if (!onRoot) window.location.href = "/";
          }
        }

        if (event === "SIGNED_IN" && session?.user) {
          console.log("✅ Nauja sesija aptikta.");
          await refreshBalances?.();
          setWasLoggedIn(true);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [logout, refreshBalances, wasLoggedIn]);

  // ✅ 3. `sessionReady` – tik kai viskas pilnai pakrauta
  useEffect(() => {
    const ready = !loadingUser && !loadingWallets && !loadingBalances && user && wallets;
    setSessionReady(ready);
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
