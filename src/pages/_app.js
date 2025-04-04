"use client";

import "@/styles/theme.css";
import "@/styles/globals.css";

import { AuthProvider } from "@/contexts/AuthContext";  // <- Tavo pagrindinis vartotojo prisijungimo valdymas
import { BalanceProvider } from "@/contexts/BalanceContext";
import { SendCryptoProvider } from "@/contexts/SendCryptoContext";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <BalanceProvider>
        <SendCryptoProvider>
          <Component {...pageProps} />
        </SendCryptoProvider>
      </BalanceProvider>
    </AuthProvider>
  );
}
