"use client";

// ✅ Import globalių stilių
import "@/styles/theme.css";
import "@/styles/globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { NetworkProvider } from "@/contexts/NetworkContext"; // ✅ PRIDĖTA
import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <NetworkProvider> {/* ✅ Pirmiau Auth, kad network galėtų veikti nepriklausomai */}
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </NetworkProvider>
    </AuthProvider>
  );
}
