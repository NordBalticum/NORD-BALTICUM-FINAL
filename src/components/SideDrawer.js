// SIDE DRAWER — ULTRA FINAL VERSION (BEYOND METAMASK/PANTOM)
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FaTimes, FaBars } from "react-icons/fa";

import { useAuth } from "@/contexts/AuthContext";
import { useMinimalReady } from "@/hooks/useMinimalReady";
import NetworkSelector from "@/components/NetworkSelector";

import styles from "@/components/sidedrawer.module.css";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Send", path: "/send" },
  { label: "Receive", path: "/receive" },
  { label: "History", path: "/history" },
  { label: "Settings", path: "/settings" },
];

export default function SideDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const { ready, loading } = useMinimalReady();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const firstLinkRef = useRef(null);

  // Scroll lock + ESC listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (typeof window !== "undefined") {
      document.body.style.overflow = open ? "hidden" : "auto";
      if (open) {
        window.addEventListener("keydown", handleKeyDown);
        setTimeout(() => {
          firstLinkRef.current?.focus();
        }, 200);
      } else {
        window.removeEventListener("keydown", handleKeyDown);
      }
      return () => {
        document.body.style.overflow = "auto";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open]);

  const toggleDrawer = () => setOpen((prev) => !prev);

  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await signOut(true);
      setTimeout(() => {
        router.replace("/");
        setOpen(false);
      }, 300);
    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
    }
  };

  if (loading || !ready) return null;

  return (
    <>
      <motion.button
        className={styles.hamburger}
        onClick={toggleDrawer}
        aria-label="Open menu"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        <FaBars size={22} />
      </motion.button>

      <AnimatePresence mode="wait" initial={false}>
        {open && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              onClick={toggleDrawer}
              aria-hidden="true"
            />

            <motion.aside
              className={styles.drawer}
              initial={{ opacity: 0, x: -80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
              role="dialog"
              aria-modal="true"
            >
              <div className={styles.drawerHeader}>
                <NetworkSelector />
                <motion.button
                  className={styles.closeIcon}
                  onClick={toggleDrawer}
                  aria-label="Close menu"
                  whileHover={{ rotate: 90 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                >
                  <FaTimes size={22} />
                </motion.button>
              </div>

              <motion.div
                className={styles.userBox}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.45 }}
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
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  {(user?.email?.length || 0) > 28
                    ? user.email.slice(0, 25) + "..."
                    : user?.email || "User"}
                </motion.p>
              </motion.div>

              <nav className={styles.nav}>
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.1 }}
                  >
                    <Link
                      href={item.path}
                      className={`${styles.link} ${
                        pathname === item.path ? styles.active : ""
                      }`}
                      onClick={() => setOpen(false)}
                      aria-current={pathname === item.path ? "page" : undefined}
                      ref={index === 0 ? firstLinkRef : null}
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
                disabled={loggingOut}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </motion.button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
