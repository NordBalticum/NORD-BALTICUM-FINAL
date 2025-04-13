"use client";

// 1️⃣ Importai
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SideDrawer from "@/components/SideDrawer";
import BottomNavigation from "@/components/BottomNavigation";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner"; // ✅ Mažas spinneris
import styles from "@/components/layout.module.css";

export default function Layout({ children }) {
  const pathname = usePathname();
  const { user, wallet, authLoading, walletLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 2️⃣ Detect Client Side ir Mount
  useEffect(() => {
    setIsClient(true);
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // ✅ STOP jei dar montuojasi
  }

  // 3️⃣ Kol Auth kraunasi arba Wallet kraunasi → Loading
  if (authLoading || walletLoading) {
    return (
      <div className={styles.layoutWrapper} style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  // 4️⃣ Kur slėpti pilną UI (login / index puslapyje)
  const hideUI = pathname === "/" || pathname === "" || pathname === null;

  // 5️⃣ Kada rodyti UI
  const showUI = isClient && user && wallet?.wallet && !hideUI;

  // 6️⃣ Struktūra
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
