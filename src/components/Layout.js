"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext"; // ✅ Ultimate Auth
import SideDrawer from "@/components/SideDrawer"; // ✅ Navigation Drawer
import BottomNav from "@/components/BottomNavigation"; // ✅ Mobile Bottom Nav
import styles from "@/components/layout.module.css"; // ✅ CSS

export default function Layout({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth(); // ✅ Pasiimam user + loading iš Auth

  const hideUI = pathname === "/"; // ✅ Jei pagrindinis puslapis, slėpti visą UI

  const showUI = !!user && !loading && !hideUI; 
  // ✅ Tik jei user prisijungęs, nebekraunam, ir nėra pagrindinis puslapis – rodom UI

  return (
    <div className={styles.layoutWrapper}>
      {showUI && <SideDrawer />}
      <main className={styles.mainContent}>
        {children}
      </main>
      {showUI && <BottomNav />}
    </div>
  );
}
