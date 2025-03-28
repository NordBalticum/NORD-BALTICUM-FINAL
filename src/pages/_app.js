"use client";

import React from "react";
import "@/styles/globals.css";
import "@/styles/theme.css";

import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { AuthProvider } from "@/contexts/AuthContext";

import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <React.StrictMode>
      <MagicLinkProvider>
        <AuthProvider>
          <WalletProvider>
            <BalanceProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </BalanceProvider>
          </WalletProvider>
        </AuthProvider>
      </MagicLinkProvider>
    </React.StrictMode>
  );
}
