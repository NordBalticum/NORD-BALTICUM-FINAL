"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext"; // <- BŪTINA ĮRAŠYTI
import SideDrawer from "@/components/SideDrawer";
import BottomNavigation from "@/components/BottomNavigation";
import styles from "@/components/layout.module.css";

export default function Layout({ children }) {
  const pathname = usePathname();
  const { user, wallet } = useAuth(); // <- BŪTINA čia
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Saugumas prieš viską

  const hideUI = pathname === "/" || pathname === "" || pathname === null;

  const showUI = user && wallet?.wallet && !hideUI;

  return (
    <div className={styles.layoutWrapper}>
      {/* ⛔️ NEJUNGIAM viso puslapio nuo useAuth!!! */}
      {showUI && <SideDrawer />}
      <main className={styles.mainContent}>
        {children}
      </main>
      {showUI && <BottomNavigation />}
    </div>
  );
}
