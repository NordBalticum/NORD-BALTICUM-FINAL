"use client";

import React from "react";
import "@/styles/theme.css";
import "@/styles/globals.css";

import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { SendCryptoProvider } from "@/contexts/SendCryptoContext";

export default function App({ Component, pageProps }) {
  return (
    <MagicLinkProvider>
      <WalletProvider>
        <BalanceProvider>
          <SendCryptoProvider>
            <Component {...pageProps} />
          </SendCryptoProvider>
        </BalanceProvider>
      </WalletProvider>
    </MagicLinkProvider>
  );
}
