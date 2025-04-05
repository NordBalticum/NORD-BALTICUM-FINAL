"use client";

// 1️⃣ Importai
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaBars } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styles from "@/components/sidedrawer.module.css";

export default function SideDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, wallet, signOut } = useAuth(); // ✅ Tik user + wallet
  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 2️⃣ Detect Client
  useEffect(() => {
    setIsClient(typeof window !== "undefined");
  }, []);

  // 3️⃣ Lock Scroll kai Drawer atidarytas
  useEffect(() => {
    if (!isClient) return;
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open, isClient]);

  // 4️⃣ Toggle Drawer
  const toggleDrawer = () => setOpen((prev) => !prev);

  // 5️⃣ Logout
  const handleLogout = async () => {
    try {
      await signOut();
      setOpen(false);
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  // 6️⃣ Navigacijos nuorodos
  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Send", path: "/send" },
    { label: "Receive", path: "/receive" },
    { label: "History", path: "/history" },
    { label: "Settings", path: "/settings" },
  ];

  // 7️⃣ Jei user arba wallet nėra → nieko nerodyti
  if (!isClient || !user || !wallet?.wallet) return null;

  // 8️⃣ UI
  return (
    <>
      <button
        className={styles.hamburger}
        onClick={toggleDrawer}
        aria-label="Open Menu"
      >
        <FaBars size={22} />
      </button>

      <AnimatePresence mode="wait">
        {open && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={toggleDrawer}
            />

            <motion.aside
              className={`${styles.drawer} ${open ? styles.open : ""}`}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Drawer Header */}
              <div className={styles.drawerHeader}>
                <button
                  className={styles.closeIcon}
                  onClick={toggleDrawer}
                  aria-label="Close Menu"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* User Info */}
              <div className={styles.userBox}>
                <img
                  src="/icons/logo.svg"
                  alt="NordBalticum Logo"
                  className={styles.logo}
                  width={120}
                  height={40}
                />
                <p className={styles.email}>{user.email}</p>
              </div>

              {/* Navigation */}
              <nav className={styles.nav}>
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.path}
                    className={`${styles.link} ${pathname === item.path ? styles.active : ""}`}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.path ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Logout */}
              <button
                className={styles.logout}
                onClick={handleLogout}
                aria-label="Logout"
              >
                Logout
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
