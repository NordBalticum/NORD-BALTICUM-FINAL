import "@/styles/globals.css";
import "@/styles/theme.css";
import React from "react";
import Head from "next/head";

import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { WalletLoadProvider } from "@/contexts/WalletLoadContext";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { GenerateWalletProvider } from "@/contexts/GenerateWalletContext"; // <- PRIDĖTA
import { AuthProvider } from "@/contexts/AuthContext"; // <- sujungia viską
import Layout from "@/components/Layout";

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
          <BalanceProvider>
            <GenerateWalletProvider> {/* <- PRIDĖTA */}
              <AuthProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </AuthProvider>
            </GenerateWalletProvider>
          </BalanceProvider>
        </WalletLoadProvider>
      </MagicLinkProvider>
    </React.StrictMode>
  );
}
