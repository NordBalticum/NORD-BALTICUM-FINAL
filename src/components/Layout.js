"use client";

// 1️⃣ Importai
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext"; // ✅ Ultimate Auth Context
import SideDrawer from "@/components/SideDrawer"; // ✅ Sidebar Navigation
import BottomNavigation from "@/components/BottomNavigation"; // ✅ Mobile Navigation
import styles from "@/components/layout.module.css"; // ✅ Layout CSS

export default function Layout({ children }) {
  const pathname = usePathname();
  const { user, wallet } = useAuth();

  // 2️⃣ Kur slėpti visą UI
  const hideUI = pathname === "/" || !pathname;

  // 3️⃣ Kada rodyti UI
  const showUI = typeof window !== "undefined" && user && wallet?.wallet && !hideUI;

  // 4️⃣ UI struktūra
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
