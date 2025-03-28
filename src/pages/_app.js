import "@/styles/globals.css";
import "@/styles/theme.css";
import React from "react";

import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { WalletLoadProvider } from "@/contexts/WalletLoadContext";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { GenerateWalletProvider } from "@/contexts/GenerateWalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <React.StrictMode>
      <MagicLinkProvider>
        <WalletLoadProvider>
          <BalanceProvider>
            <GenerateWalletProvider>
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
