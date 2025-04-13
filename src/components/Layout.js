"use client";

// ✅ IMPORTAI
import { usePathname } from "next/navigation";
import SideDrawer from "@/components/SideDrawer";
import BottomNavigation from "@/components/BottomNavigation";
import styles from "@/components/layout.module.css";

// ✅ PAGRINDINIS KOMPONENTAS
export default function Layout({ children }) {
  const pathname = usePathname();

  // ✅ Login puslapio detekcija
  const hideUI = pathname === "/" || pathname === "" || pathname === null;

  return (
    <div className={styles.layoutWrapper}>
      {/* ✅ SideDrawer ir BottomNavigation rodom tik jei nesame login puslapyje */}
      {!hideUI && <SideDrawer />}
      <main className={styles.mainContent}>
        {children}
      </main>
      {!hideUI && <BottomNavigation />}
    </div>
  );
}
