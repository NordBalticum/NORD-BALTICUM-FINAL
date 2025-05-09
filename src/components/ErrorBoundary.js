"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styles from "@/styles/errorboundary.module.css"; // Create and style error page

// Error Boundary Component
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  // Error handling
  const handleError = (error, info) => {
    setHasError(true);
    console.error("ErrorBoundary caught an error:", error, info);

    // Display error message with Toast
    toast.error("Something went wrong. We are looking into it!", {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: true,
      closeButton: false,
      pauseOnHover: false,
      draggable: false,
      theme: "dark",
    });

    // If you are using an error tracking service (e.g., Sentry)
    // Sentry.captureException(error);
  };

  // Error tracking
  useEffect(() => {
    const handleGlobalErrors = (errorEvent) => {
      handleError(errorEvent.error, { componentStack: "Error boundary" });
    };

    const handleUnhandledRejection = (event) => {
      handleError(event.reason, { componentStack: "Unhandled rejection" });
    };

    window.addEventListener("error", handleGlobalErrors);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalErrors);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.iconWrapper}>
          <div className={styles.errorIcon}>⚠️</div>
        </div>
        <h2 className={styles.errorMessage}>Oops, something went wrong!</h2>
        <p className={styles.errorDetails}>
          An unexpected error occurred. Please try again later.
        </p>
        <button
          className={styles.reloadButton}
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return children;
};

export default ErrorBoundary;
