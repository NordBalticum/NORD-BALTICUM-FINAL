// src/layout/layout.js
"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import SideDrawer from "@/components/SideDrawer";
import BottomNav from "@/components/BottomNav";
import styles from "./layout.module.css";

export default function Layout({ children }) {
  const router = useRouter();
  const { pathname } = router;
  const { user } = useMagicLink();

  // Puslapiai be layout (pvz. /)
  const isPublic = pathname === "/";

  useEffect(() => {
    if (!user && !isPublic) {
      router.push("/");
    }
  }, [user, pathname, isPublic, router]);

  if (!user && !isPublic) {
    return (
      <div className={styles.loadingScreen}>
        Connecting wallet...
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {!isPublic && <SideDrawer />}
      <main className={styles.main}>{children}</main>
      {!isPublic && <BottomNav />}
    </div>
  );
}
