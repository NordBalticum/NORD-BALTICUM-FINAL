"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styles from "@/styles/ErrorBoundary.module.css"; // Sukurkite stilių klaidų puslapiui

// Error Boundary Component
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  // Klaidos apdorojimas
  const handleError = (error, info) => {
    setHasError(true);
    console.error("ErrorBoundary caught an error:", error, info);

    // Parodyti klaidos pranešimą su Toast
    toast.error("Something went wrong. We are looking into it!", {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: true,
      closeButton: false,
      pauseOnHover: false,
      draggable: false,
      theme: "dark",
    });

    // Jei naudojate klaidų stebėjimo paslaugą (pvz., Sentry)
    // Sentry.captureException(error);
  };

  // Klaidos sekimas
  useEffect(() => {
    window.addEventListener("error", (errorEvent) => {
      handleError(errorEvent.error, { componentStack: "Error boundary" });
    });

    window.addEventListener("unhandledrejection", (event) => {
      handleError(event.reason, { componentStack: "Unhandled rejection" });
    });

    return () => {
      window.removeEventListener("error", (errorEvent) => {
        handleError(errorEvent.error, { componentStack: "Error boundary" });
      });
      window.removeEventListener("unhandledrejection", (event) => {
        handleError(event.reason, { componentStack: "Unhandled rejection" });
      });
    };
  }, []);

  if (hasError) {
    return (
      <div className={styles.errorContainer}>
        <h2 className={styles.errorMessage}>Oops, something went wrong!</h2>
        <p className={styles.errorDetails}>
          An unexpected error occurred. Please try again later.
        </p>
        <button className={styles.reloadButton} onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }

  return children;
};

export default ErrorBoundary;
