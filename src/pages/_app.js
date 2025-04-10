"use client";

import "@/styles/theme.css";
import "@/styles/globals.css";

import { AuthProvider } from "@/contexts/AuthContext"; // Autentifikacijos kontekstas
import Layout from "@/components/Layout"; // Pagrindinis Layout

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Layout> {/* Apvyniojame Layout komponentu */}
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
