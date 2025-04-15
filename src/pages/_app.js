"use client";

// ✅ Import globalių stilių
import "@/styles/theme.css";
import "@/styles/globals.css";

// ✅ Contexts
import { AuthProvider } from "@/contexts/AuthContext";       // 1️⃣ Autentifikacija ir piniginė
import { NetworkProvider } from "@/contexts/NetworkContext"; // 2️⃣ Tinklo pasirinkimas (BNB, ETH, kt.)
import { BalanceProvider } from "@/contexts/BalanceContext"; // 3️⃣ Balansų + kainų gavimas
import { SendProvider } from "@/contexts/SendContext";       // 4️⃣ Siuntimo logika + fee kalkuliacija

// ✅ UI Layout
import Layout from "@/components/Layout";

// ✅ Main App
export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <NetworkProvider>
        <BalanceProvider>
          <SendProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </SendProvider>
        </BalanceProvider>
      </NetworkProvider>
    </AuthProvider>
  );
}
