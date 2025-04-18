"use client";

import "@/styles/theme.css";
import "@/styles/globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { SendProvider } from "@/contexts/SendContext";
import ErrorBoundary from "@/components/ErrorBoundary"; // Importuojame ErrorBoundary

import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <NetworkProvider>
        <BalanceProvider>
          <SendProvider>
            <ErrorBoundary> {/* Apvyniojame visą aplikaciją ErrorBoundary */}
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </ErrorBoundary>
          </SendProvider>
        </BalanceProvider>
      </NetworkProvider>
    </AuthProvider>
  );
}
