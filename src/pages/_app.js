"use client";

import React from "react";
import "@/styles/theme.css";
import "@/styles/globals.css";

import { MagicLinkProvider } from "@/contexts/MagicLinkContext";
import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <React.StrictMode>
      <MagicLinkProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </MagicLinkProvider>
    </React.StrictMode>
  );
}
