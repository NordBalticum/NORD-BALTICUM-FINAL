"use client";

// 1️⃣ Importai
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext"; // ✅ Ultimate Auth Context
import SideDrawer from "@/components/SideDrawer"; // ✅ Sidebar Navigation
import BottomNav from "@/components/BottomNavigation"; // ✅ Mobile Navigation
import styles from "@/components/layout.module.css"; // ✅ Layout CSS

export default function Layout({ children }) {
  const pathname = usePathname();
  const { user, wallet } = useAuth(); // ✅ Tik user ir wallet

  // 2️⃣ Kur slėpti visą UI
  const hideUI = pathname === "/";

  // 3️⃣ Kada rodyti UI
  const showUI = user && wallet?.wallet && !hideUI;
  // ✅ Tik jei user YRA, wallet YRA, ir nėra pagrindinis puslapis → tada rodom.

  // 4️⃣ UI struktūra
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
