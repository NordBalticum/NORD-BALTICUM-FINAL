// src/pages/_app.js

import React from "react";
import "@/styles/theme.css";
import "@/styles/globals.css";

import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { WalletCheckProvider } from "@/contexts/WalletCheckContext";
import { WalletProvider } from "@/contexts/WalletContext";

import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <MagicLinkProvider>
      <WalletCheckProvider>
        <WalletProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </WalletProvider>
      </WalletCheckProvider>
    </MagicLinkProvider>
  );
}
