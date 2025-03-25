"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { createClient } from "@supabase/supabase-js";

export const WebAuthnContext = createContext();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const WebAuthnProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [webauthnReady, setWebauthnReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user || null);
      setWebauthnReady(true);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // === Start WebAuthn Registration ===
  const registerWebAuthn = async (email) => {
    try {
      const response = await fetch("/api/webauthn/generate-registration-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const options = await response.json();

      const attResp = await startRegistration(options);

      const verifyResponse = await fetch("/api/webauthn/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, attestationResponse: attResp }),
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.verified) {
        localStorage.setItem("biometric_user", email);
        console.log("✅ WebAuthn registration successful");
        return true;
      } else {
        console.error("❌ WebAuthn registration failed");
        return false;
      }
    } catch (err) {
      console.error("❌ WebAuthn registration error:", err);
      return false;
    }
  };

  // === Start WebAuthn Login ===
  const loginWebAuthn = async (email) => {
    try {
      const response = await fetch("/api/webauthn/generate-authentication-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const options = await response.json();

      const authResp = await startAuthentication(options);

      const verifyResponse = await fetch("/api/webauthn/verify-authentication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, authenticationResponse: authResp }),
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.verified) {
        console.log("✅ WebAuthn login successful");
        localStorage.setItem("biometric_user", email);
        return true;
      } else {
        console.error("❌ WebAuthn login failed");
        return false;
      }
    } catch (err) {
      console.error("❌ WebAuthn login error:", err);
      return false;
    }
  };

  // === Remove biometric session ===
  const clearBiometricSession = () => {
    localStorage.removeItem("biometric_user");
  };

  return (
    <WebAuthnContext.Provider
      value={{
        authUser,
        webauthnReady,
        registerWebAuthn,
        loginWebAuthn,
        clearBiometricSession,
      }}
    >
      {children}
    </WebAuthnContext.Provider>
  );
};

export const useWebAuthn = () => useContext(WebAuthnContext);
