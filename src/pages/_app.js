"use client";

import "@/styles/globals.css";
import "@/styles/theme.css";
import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { WalletLoadProvider } from "@/contexts/WalletLoadContext";
import { WebAuthnProvider } from "@/contexts/WebAuthnContext";
import { BalanceProvider } from "@/contexts/BalanceContext";
import Layout from "@/components/Layout";
import Head from "next/head";
import React from "react";

export default function App({ Component, pageProps }) {
  return (
    <React.StrictMode>
      <Head>
        <title>NordBalticum</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, user-scalable=no"
        />
        <meta name="theme-color" content="#0A1F44" />
        <link rel="icon" href="/icons/logo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </Head>

      <MagicLinkProvider>
        <WalletLoadProvider>
          <WebAuthnProvider>
            <BalanceProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </BalanceProvider>
          </WebAuthnProvider>
        </WalletLoadProvider>
      </MagicLinkProvider>
    </React.StrictMode>
  );
}
