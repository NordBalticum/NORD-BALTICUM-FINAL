"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SideDrawer from "@/components/SideDrawer";
import BottomNavigation from "@/components/BottomNavigation";
import styles from "@/components/layout.module.css";

export default function Layout({ children }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  const hideUI = pathname === "/" || pathname === "" || pathname === null;

  // ✅ Mount detect
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  if (!isClient) {
    return null; // ❌ Ne renderinam jei nesame naršyklėje
  }

  return (
    <div className={styles.layoutWrapper}>
      {!hideUI && <SideDrawer />}
      <main className={styles.mainContent}>
        {children}
      </main>
      {!hideUI && <BottomNavigation />}
    </div>
  );
}
