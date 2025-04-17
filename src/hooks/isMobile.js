"use client";

import { useState, useEffect } from "react";

// The hook checks if the device is mobile, tablet, or desktop based on window width
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 768) {
        setIsMobile(true);
        setIsTablet(false);
      } else if (width <= 1024) {
        setIsTablet(true);
        setIsMobile(false);
      } else {
        setIsMobile(false);
        setIsTablet(false);
      }
    };

    handleResize(); // Initialize on mount
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize); // Cleanup on unmount
    };
  }, []);

  return { isMobile, isTablet };
}
