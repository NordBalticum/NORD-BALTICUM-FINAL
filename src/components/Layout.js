"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SideDrawer from "@/components/SideDrawer";
import BottomNavigation from "@/components/BottomNavigation";
import styles from "@/components/layout.module.css";

export default function Layout({ children }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 1️⃣ Detect Client Side
  useEffect(() => {
    setIsClient(true);
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // 🛡️ Sustabdyti viską iki mount
  }

  const { user, wallet } = useAuth(); // 🛡️ Tik po mounted!

  // 2️⃣ Kur slėpti visą UI
  const hideUI = pathname === "/" || pathname === "" || pathname === null;

  // 3️⃣ Kada rodyti UI
  const showUI = isClient && user && wallet?.wallet && !hideUI;

  // 4️⃣ Struktūra
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
