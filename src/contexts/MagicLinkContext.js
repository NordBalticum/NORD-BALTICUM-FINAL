"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Magic } from "magic-sdk";
import { createWallet } from "@/lib/ethers";

export const MagicContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  const [magic, setMagic] = useState(null);
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    const initMagic = async () => {
      const magicInstance = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY);
      setMagic(magicInstance);

      try {
        const isLoggedIn = await magicInstance.user.isLoggedIn();
        if (isLoggedIn) {
          const userMetadata = await magicInstance.user.getMetadata();
          const localWallet = loadWalletFromStorage();

          if (localWallet) {
            setUser(userMetadata);
            setWallet(localWallet);
          } else {
            const newWallet = createWallet();
            saveWalletToStorage(newWallet);
            setUser(userMetadata);
            setWallet(newWallet);
          }
        }
      } catch (err) {
        console.error("❌ Magic init error:", err);
      }
    };

    initMagic();
  }, []);

  const loginWithEmail = async (email) => {
    try {
      await magic.auth.loginWithEmailOTP({ email });
      const userMetadata = await magic.user.getMetadata();
      const newWallet = createWallet();
      saveWalletToStorage(newWallet);
      setUser(userMetadata);
      setWallet(newWallet);
    } catch (err) {
      console.error("❌ Login error:", err);
    }
  };

  const logout = async () => {
    try {
      await magic.user.logout();
      setUser(null);
      setWallet(null);
      localStorage.removeItem("userWallet");
    } catch (err) {
      console.error("❌ Logout error:", err);
    }
  };

  const saveWalletToStorage = (wallet) => {
    if (!wallet?.privateKey) return;
    const data = {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
    localStorage.setItem("userWallet", JSON.stringify(data));
  };

  const loadWalletFromStorage = () => {
    try {
      const data = localStorage.getItem("userWallet");
      if (!data) return null;
      const { privateKey } = JSON.parse(data);
      return new createWallet(privateKey); // iš privataus raktos sukuria ethers Wallet
    } catch (err) {
      console.error("❌ Load wallet error:", err);
      return null;
    }
  };

  return (
    <MagicContext.Provider value={{ magic, user, wallet, loginWithEmail, logout }}>
      {children}
    </MagicContext.Provider>
  );
};

export const useMagic = () => useContext(MagicContext);
