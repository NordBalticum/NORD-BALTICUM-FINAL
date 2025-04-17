"use client";

import "@/styles/theme.css";
import "@/styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { BalanceProvider } from "@/contexts/BalanceContext";
import { SendProvider } from "@/contexts/SendContext";
import { SystemReadyProvider } from "@/contexts/SystemReadyContext";
import Layout from "@/components/Layout";
import ErrorBoundary from "@/components/ErrorBoundary"; // Importuojame klaidų tvarkymo komponentą
import { useEffect } from "react";

// Error Boundary komponentas
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      console.error("Error in the application:", error);
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  if (hasError) {
    return <div className="error-message">Something went wrong, please try again later.</div>;
  }

  return children;
};

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary> {/* Vyniojame visą aplikaciją klaidų tvarkymui */}
      <AuthProvider>
        <NetworkProvider>
          <BalanceProvider>
            <SendProvider>
              <SystemReadyProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </SystemReadyProvider>
            </SendProvider>
          </BalanceProvider>
        </NetworkProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
