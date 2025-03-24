"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Magic } from "magic-sdk";
import { Wallet } from "ethers";

export const MagicContext = createContext();

export const MagicLinkProvider = ({ children }) => {
  const [magic, setMagic] = useState(null);
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);

  // ✅ Inicijuojam Magic SDK be jokio key (kaip veikia tavo sistemoj)
  useEffect(() => {
    const initMagic = async () => {
      try {
        const magicInstance = new Magic(); // be publishableKey
        setMagic(magicInstance);

        const isLoggedIn = await magicInstance.user.isLoggedIn();
        if (isLoggedIn) {
          const userMetadata = await magicInstance.user.getMetadata();
          const loadedWallet = loadWalletFromStorage();

          if (loadedWallet) {
            setUser(userMetadata);
            setWallet(loadedWallet);
          } else {
            const newWallet = Wallet.createRandom();
            saveWalletToStorage(newWallet);
            setUser(userMetadata);
            setWallet(newWallet);
          }
        }
      } catch (err) {
        console.error("❌ Magic SDK init error:", err);
      }
    };

    initMagic();
  }, []);

  // ✅ Login su OTP per email
  const loginWithEmail = async (email) => {
    try {
      await magic.auth.loginWithEmailOTP({ email });
      const userMetadata = await magic.user.getMetadata();

      const newWallet = Wallet.createRandom();
      saveWalletToStorage(newWallet);
      setUser(userMetadata);
      setWallet(newWallet);
    } catch (err) {
      console.error("❌ Login failed:", err);
    }
  };

  // ✅ Logout + wallet valymas
  const logout = async () => {
    try {
      await magic.user.logout();
      setUser(null);
      setWallet(null);
      localStorage.removeItem("userWallet");
    } catch (err) {
      console.error("❌ Logout failed:", err);
    }
  };

  // ✅ Išsaugo piniginę į localStorage
  const saveWalletToStorage = (wallet) => {
    if (!wallet?.privateKey) return;
    const data = {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
    localStorage.setItem("userWallet", JSON.stringify(data));
  };

  // ✅ Užkrauna piniginę iš localStorage
  const loadWalletFromStorage = () => {
    try {
      const data = localStorage.getItem("userWallet");
      if (!data) return null;

      const { privateKey } = JSON.parse(data);
      return new Wallet(privateKey);
    } catch (err) {
      console.error("❌ Failed to load wallet from storage:", err);
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
