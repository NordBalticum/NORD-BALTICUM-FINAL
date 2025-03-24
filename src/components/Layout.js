"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";
import SideDrawer from "@/components/SideDrawer";
import BottomNav from "@/components/BottomNavigation";
import styles from "@/components/layout.module.css";

export default function Layout({ children }) {
  const router = useRouter();
  const hideOnRoot = router.pathname === "/";

  useEffect(() => {
    document.body.style.overflow = "hidden";
  }, []);

  return (
    <div className={styles.layoutWrapper}>
      {!hideOnRoot && <SideDrawer />}
      <main className={styles.mainContent}>{children}</main>
      {!hideOnRoot && <BottomNav />}
    </div>
  );
}
