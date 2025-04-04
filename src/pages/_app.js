"use client";

import React from "react";
import "@/styles/theme.css";
import "@/styles/globals.css";

import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { SendCryptoProvider } from "@/contexts/SendCryptoContext";

import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <MagicLinkProvider>
      <WalletProvider>
        <BalanceProvider>
          <SendCryptoProvider>
            <Layout>
              {/* Šitas patikrina ar jau esam ant kliento pusės */}
              {typeof window !== "undefined" && <Component {...pageProps} />}
            </Layout>
          </SendCryptoProvider>
        </BalanceProvider>
      </WalletProvider>
    </MagicLinkProvider>
  );
              }
