"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState(null);

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingWallets, setLoadingWallets] = useState(true);

  // ✅ Gaunam prisijungusį vartotoją iš Supabase
  useEffect(() => {
    const getUser = async () => {
      setLoadingUser(true);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
      }

      setLoadingUser(false);
    };

    getUser();
  }, []);

  // ✅ Gaunam piniginę, kai tik turim user
  useEffect(() => {
    if (!user) return;

    const fetchWallet = async () => {
      setLoadingWallets(true);
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setWallet(data);
      }

      setLoadingWallets(false);
    };

    fetchWallet();
  }, [user]);

  // ✅ Gaunam balansus, kai tik turim piniginę
  useEffect(() => {
    if (!wallet) return;

    const fetchBalances = async () => {
      const { data, error } = await supabase
        .from("balances")
        .select("*")
        .eq("wallet_id", wallet.id);

      const result = {};

      data?.forEach((item) => {
        result[item.network] = {
          amount: item.amount,
          eur: item.eur,
        };
      });

      setBalances(result);
    };

    fetchBalances();
  }, [wallet]);

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        balances,
        loadingUser,
        loadingWallets,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
