"use client";

import { useEffect, useState } from "react";

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      console.error(error);
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  if (hasError) {
    return <div>Something went wrong!</div>;
  }

  return children;
};

export default ErrorBoundary;
