"use client";

// ✅ IMPORTS
import SideDrawer from "@/components/SideDrawer";
import BottomNavigation from "@/components/BottomNavigation";
import { useEffect, useState } from "react";
import styles from "@/components/layout.module.css";

// ✅ PAGRINDINIS KOMPONENTAS
export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className={`${styles.layoutWrapper} ${isMobile ? styles.mobileLayout : ''}`}>
      <SideDrawer />
      <main className={styles.mainContent}>
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
