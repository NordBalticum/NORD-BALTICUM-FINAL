"use client";  

import "@/styles/theme.css";  
import "@/styles/globals.css";  

import { AuthProvider } from "@/contexts/AuthContext"; // Vienintelis variklis!  
import Layout from "@/components/Layout"; // Importuojame Layout komponentą

export default function App({ Component, pageProps }) {  
  return (  
    <AuthProvider>  
      <Layout> {/* Apvyniojame Layout komponentu */}
        <Component {...pageProps} />  
      </Layout>  
    </AuthProvider>  
  );  
}
