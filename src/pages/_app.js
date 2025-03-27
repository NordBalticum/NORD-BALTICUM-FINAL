import "@/styles/globals.css";
import "@/styles/theme.css";
import React from "react";
import Head from "next/head";

import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { WalletLoadProvider } from "@/contexts/WalletLoadContext";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { AuthProvider } from "@/contexts/AuthContext"; // <- jungia viską
import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <React.StrictMode>
      <Head>
        <title>NordBalticum</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#0A1F44" />
        <link rel="icon" href="/icons/logo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </Head>

      <MagicLinkProvider> {/* <- PRIVALOMAS */}
        <WalletLoadProvider>
            <BalanceProvider>
              <AuthProvider> {/* <- čia jungiam viską */}
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </AuthProvider>
            </BalanceProvider>
        </WalletLoadProvider>
      </MagicLinkProvider>
    </React.StrictMode>
  );
}
