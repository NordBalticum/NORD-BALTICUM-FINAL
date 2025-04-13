"use client";

// ✅ Import globalių stilių
import "@/styles/theme.css";
import "@/styles/globals.css";

import { AuthProvider } from "@/contexts/AuthContext"; // 🔹 1. AuthContext (prisijungimas, wallet)
import { NetworkProvider } from "@/contexts/NetworkContext"; // 🔹 2. NetworkContext (active network pasirinkimas)
import { BalanceProvider } from "@/contexts/BalanceContext"; // 🔹 3. BalanceContext (balansai ir kainos)
import { SendProvider } from "@/contexts/SendContext"; // 🔹 4. SendContext (siuntimai ir fee kalkuliacija)

import Layout from "@/components/Layout";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider> {/* 1️⃣ Autentifikacija */}
      <NetworkProvider> {/* 2️⃣ Tinklo pasirinkimas */}
        <BalanceProvider> {/* 3️⃣ Balansai + Kainos */}
          <SendProvider> {/* 4️⃣ Siuntimo operacijos */}
            <Layout> {/* 5️⃣ Globalus Layout */}
              <Component {...pageProps} /> {/* 6️⃣ Puslapiai */}
            </Layout>
          </SendProvider>
        </BalanceProvider>
      </NetworkProvider>
    </AuthProvider>
  );
}
