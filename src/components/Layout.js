"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SideDrawer from "@/components/SideDrawer";
import BottomNavigation from "@/components/BottomNavigation";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/components/layout.module.css";

export default function Layout({ children }) {
  const pathname = usePathname();
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const hideUI = pathname === "/" || pathname === "" || pathname === null;

  // Mount tikrinimas
  useEffect(() => {
    setIsClient(true);
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // TIK tada rodome loaderį, jei NĖRA login puslapyje
  if (!hideUI && (authLoading || walletLoading)) {
    return (
      <div className={styles.layoutWrapper} style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  // Kada rodyti SideDrawer ir BottomNavigation
  const showUI = isClient && user && wallet?.wallet && !hideUI;

  return (
    <div className={styles.layoutWrapper}>
      {showUI && <SideDrawer />}
      <main className={styles.mainContent}>
        {children}
      </main>
      {showUI && <BottomNavigation />}
    </div>
  );
}
