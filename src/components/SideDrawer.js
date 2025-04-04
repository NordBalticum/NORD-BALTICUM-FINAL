"use client";

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
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open, isClient]);

  const toggleDrawer = () => setOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await signOut();
      setOpen(false);
      router.replace("/");
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Send", path: "/send" },
    { label: "Receive", path: "/receive" },
    { label: "History", path: "/history" },
    { label: "Settings", path: "/settings" },
  ];

  if (!isClient || !user) return null;

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
              <div className={styles.drawerHeader}>
                <button
                  className={styles.closeIcon}
                  onClick={toggleDrawer}
                  aria-label="Close Menu"
                >
                  <FaTimes size={20} />
                </button>
              </div>

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

              <nav className={styles.nav}>
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.path}
                    className={`${styles.link} ${
                      pathname === item.path ? styles.active : ""
                    }`}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.path ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

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
