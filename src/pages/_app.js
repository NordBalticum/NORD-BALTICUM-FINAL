"use client";

import "@/styles/theme.css";
import "@/styles/globals.css";

import { AuthProvider } from "@/contexts/AuthContext"; // Vienintelis variklis!
import Layout from "@/components/Layout"; // Importuojame Layout komponentą
import { Toaster } from "react-hot-toast"; // Pridėti react-hot-toast

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Layout> {/* Apvyniojame Layout komponentu */}
        <Toaster position="top-right" reverseOrder={false} /> {/* Reikia čia įdėti Toaster */}
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
