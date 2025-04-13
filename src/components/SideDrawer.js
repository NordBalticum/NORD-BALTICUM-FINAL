"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FaTimes, FaBars } from "react-icons/fa";
import styles from "@/components/sidedrawer.module.css";

export default function SideDrawer() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(typeof window !== "undefined");
  }, []);

  if (!isClient) return null; // ✅ STOP jei nesame naršyklėje

  const { user, wallet, signOut, authLoading, walletLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const toggleDrawer = () => setOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await signOut(true);
      setOpen(false);
      document.body.style.overflow = "auto";
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error.message || error);
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Send", path: "/send" },
    { label: "Receive", path: "/receive" },
    { label: "History", path: "/history" },
    { label: "Settings", path: "/settings" },
  ];

  if (authLoading || walletLoading || !user || !wallet?.wallet?.address) {
    return null;
  }

  return (
    <>
      {/* ✅ Hamburger */}
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

      {/* ✅ Animate Presence */}
      <AnimatePresence mode="wait">
        {open && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              onClick={toggleDrawer}
            />
            <motion.aside
              className={`${styles.drawer} ${open ? styles.open : ""}`}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
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

              <nav className={styles.nav}>
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  >
                    <Link
                      href={item.path}
                      className={`${styles.link} ${pathname === item.path ? styles.active : ""}`}
                      onClick={() => setOpen(false)}
                      aria-current={pathname === item.path ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

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
