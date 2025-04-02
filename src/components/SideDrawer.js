"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useSystem } from "@/contexts/SystemContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import { FaBars, FaTimes } from "react-icons/fa";

import styles from "@/components/sidedrawer.module.css";

export default function SideDrawer() {
  const router = useRouter();
  const { user, logout, loading, wallet } = useSystem();

  const [open, setOpen] = useState(false);
  const toggleDrawer = () => setOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await logout();
      setOpen(false);
      router.replace("/");
    } catch (err) {
      console.error("❌ Logout failed:", err.message);
      alert("Logout failed. Please try again.");
    }
  };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Send", path: "/send" },
    { label: "Receive", path: "/receive" },
    { label: "History", path: "/history" },
    { label: "Settings", path: "/settings" },
  ];

  if (!user || loading) return null;

  return (
    <>
      <motion.button
        className={styles.hamburger}
        onClick={toggleDrawer}
        aria-label="Open menu"
        whileTap={{ scale: 0.9 }}
      >
        <FaBars size={22} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.aside
              className={styles.drawer}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
            >
              <div className={styles.drawerHeader}>
                <button
                  className={styles.closeIcon}
                  onClick={toggleDrawer}
                  aria-label="Close menu"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className={styles.userBox}>
                <AvatarDisplay
                  walletAddress={wallet?.address || "0x0000"}
                  size={64}
                />
                <p className={styles.email}>{user?.email}</p>
              </div>

              <nav className={styles.nav}>
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path} legacyBehavior>
                    <a className={styles.link} onClick={() => setOpen(false)}>
                      {item.label}
                    </a>
                  </Link>
                ))}
                <button className={styles.logout} onClick={handleLogout}>
                  Sign Out
                </button>
              </nav>
            </motion.aside>

            <motion.div
              className={styles.backdrop}
              onClick={toggleDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
