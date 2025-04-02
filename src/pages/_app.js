// src/pages/_app.js

"use client";

import React from "react";
import "@/styles/theme.css";
import "@/styles/globals.css";

import { SystemProvider } from "@/contexts/SystemContext";
import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <SystemProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SystemProvider>
  );
}
