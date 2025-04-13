"use client";

// 1️⃣ Importai
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext"; // ✅ Ultimate Auth Context
import SideDrawer from "@/components/SideDrawer"; // ✅ Sidebar Navigation
import BottomNavigation from "@/components/BottomNavigation"; // ✅ Mobile Navigation
import styles from "@/components/layout.module.css"; // ✅ Layout CSS

export default function Layout({ children }) {
  const pathname = usePathname();
  const { user, wallet } = useAuth();

  const [isClient, setIsClient] = useState(false);

  // 2️⃣ Detect Client Side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 3️⃣ Kur slėpti visą UI
  const hideUI = pathname === "/" || pathname === "" || pathname === null;

  // 4️⃣ Kada rodyti UI
  const showUI = isClient && user && wallet?.wallet && !hideUI;

  // 5️⃣ Struktūra
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
