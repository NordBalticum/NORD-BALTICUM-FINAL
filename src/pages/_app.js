"use client";

import "@/styles/theme.css";
import "@/styles/globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { SendProvider } from "@/contexts/SendContext";
import { SystemReadyProvider } from "@/contexts/SystemReadyContext";

import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <NetworkProvider>
        <BalanceProvider>
          <SendProvider>
            <SystemReadyProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </SystemReadyProvider>
          </SendProvider>
        </BalanceProvider>
      </NetworkProvider>
    </AuthProvider>
  );
}
