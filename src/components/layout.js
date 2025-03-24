"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";
import SideDrawer from "./SideDrawer";
import BottomNav from "./BottomNav";
import styles from "./layout.module.css";

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
