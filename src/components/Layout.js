"use client";

// ✅ IMPORTAI
import SideDrawer from "@/components/SideDrawer";
import BottomNavigation from "@/components/BottomNavigation";
import styles from "@/components/layout.module.css";

// ✅ PAGRINDINIS KOMPONENTAS
export default function Layout({ children }) {
  return (
    <div className={styles.layoutWrapper}>
      <SideDrawer />
      <main className={styles.mainContent}>
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
