"use client";

// 1️⃣ IMPORTAI
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FaTimes, FaBars } from "react-icons/fa";

import { useAuth } from "@/contexts/AuthContext";
import { useMinimalReady } from "@/hooks/useMinimalReady";

import styles from "@/components/sidedrawer.module.css";

// 2️⃣ NAVIGACIJOS ELEMENTAI
const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Send", path: "/send" },
  { label: "Receive", path: "/receive" },
  { label: "History", path: "/history" },
  { label: "Settings", path: "/settings" },
];

// 3️⃣ PAGRINDINIS KOMPONENTAS
export default function SideDrawer() {
  const router = useRouter();
  const pathname = usePathname();

  const { signOut, user } = useAuth();
  const { ready, loading } = useMinimalReady();

  const [open, setOpen] = useState(false);

  // ✅ Disable scroll kai drawer atidarytas
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.style.overflow = open ? "hidden" : "auto";
      return () => {
        document.body.style.overflow = "auto";
      };
    }
  }, [open]);

  const toggleDrawer = () => setOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await signOut(true);
      setOpen(false);
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error.message || error);
    }
  };

  // ✅ Jei sistema dar kraunasi arba nepasiruošusi → nieko nerodom
  if (loading || !ready) return null;

  return (
    <>
      {/* ✅ Hamburger Button */}
      <motion.button
        className={styles.hamburger}
        onClick={toggleDrawer}
        aria-label="Open Menu"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <FaBars size={22} />
      </motion.button>

      {/* ✅ Drawer + Backdrop */}
      <AnimatePresence mode="wait" initial={false}>
        {open && (
          <>
            {/* ✅ Fonas */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              onClick={toggleDrawer}
            />

            {/* ✅ Drawer */}
            <motion.aside
              className={styles.drawer}
              initial={{ opacity: 0, x: -80, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
            >
              {/* ✅ Header */}
              <div className={styles.drawerHeader}>
                <motion.button
                  className={styles.closeIcon}
                  onClick={toggleDrawer}
                  aria-label="Close Menu"
                  whileHover={{ rotate: 90 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <FaTimes size={22} />
                </motion.button>
              </div>

              {/* ✅ Vartotojo Info */}
              <motion.div
                className={styles.userBox}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <img
                  src="/icons/logo.svg"
                  alt="NordBalticum Logo"
                  className={styles.logo}
                  width={120}
                  height={40}
                />
                <motion.p
                  className={styles.email}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {user?.email || "User"}
                </motion.p>
              </motion.div>

              {/* ✅ Navigacija */}
              <nav className={styles.nav}>
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.4 + index * 0.1,
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                  >
                    <Link
                      href={item.path}
                      className={`${styles.link} ${
                        pathname === item.path ? styles.active : ""
                      }`}
                      onClick={() => setOpen(false)}
                      aria-current={pathname === item.path ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* ✅ Logout Button */}
              <motion.button
                className={styles.logout}
                onClick={handleLogout}
                aria-label="Logout"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                Logout
              </motion.button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
