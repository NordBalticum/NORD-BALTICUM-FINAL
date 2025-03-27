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
import { useGenerateWallet } from "@/contexts/GenerateWalletContext"; // <- Pridėtas!

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
  const { generateWallet } = useGenerateWallet(); // <- Pridėta funkcija, jei reikalinga

  const [sessionReady, setSessionReady] = useState(false);
  const wasLoggedInRef = useRef(false);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const isOnRoot = window.location.pathname === "/";

        if (event === "SIGNED_OUT" || !session?.user) {
          console.warn("⚠️ Session ended or user signed out.");

          if (wasLoggedInRef.current) {
            alert("Your session has ended. Please log in again.");
            await logout();
            if (!isOnRoot) window.location.href = "/";
          }
        }

        if (event === "SIGNED_IN" && session?.user) {
          console.log("✅ Session started. Refreshing balances...");
          await refreshBalances?.();
          wasLoggedInRef.current = true;
        }
      }
    );

    return () => subscription?.unsubscribe?.();
  }, [logout, refreshBalances]);

  useEffect(() => {
    const ready =
      !loadingUser &&
      !loadingWallets &&
      !loadingBalances &&
      user &&
      wallets;
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
        generateWallet, // <- jei kažkur reikia naudoti tiesiogiai
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
