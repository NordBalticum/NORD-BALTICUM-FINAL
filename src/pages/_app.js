"use client";

import React from "react";
import "@/styles/theme.css";
import "@/styles/globals.css";

import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { SendCryptoProvider } from "@/contexts/SendCryptoContext";

import Layout from "@/components/Layout";

export default function RootLayout({ children }) {
  return (
    <MagicLinkProvider>
      <WalletProvider>
        <BalanceProvider>
          <SendCryptoProvider>
            <Layout>
              {children}
            </Layout>
          </SendCryptoProvider>
        </BalanceProvider>
      </WalletProvider>
    </MagicLinkProvider>
  );
}
