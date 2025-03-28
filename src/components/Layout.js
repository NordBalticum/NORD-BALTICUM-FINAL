"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import SideDrawer from "@/components/SideDrawer";
import BottomNav from "@/components/BottomNavigation";
import styles from "@/components/layout.module.css";

export default function Layout({ children }) {
  const pathname = usePathname();
  const hideUI = pathname === "/";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className={styles.layoutWrapper}>
      {!hideUI && <SideDrawer />}
      <main className={styles.mainContent}>{children}</main>
      {!hideUI && <BottomNav />}
    </div>
  );
}
