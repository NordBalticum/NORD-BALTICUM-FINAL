"use client";

import React from "react";
import "@/styles/globals.css";
import "@/styles/theme.css";

import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { WalletProvider } from "@/contexts/WalletContext";

import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <React.StrictMode>
      <MagicLinkProvider>
        <WalletProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </WalletProvider>
      </MagicLinkProvider>
    </React.StrictMode>
  );
}
