"use client";

import React from "react";
import "@/styles/theme.css";
import "@/styles/globals.css";

import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { BalanceProvider } from "@/contexts/BalanceContext";

import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <React.StrictMode>
      <MagicLinkProvider>
        <WalletProvider>
          <BalanceProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </BalanceProvider>
        </WalletProvider>
      </MagicLinkProvider>
    </React.StrictMode>
  );
}
