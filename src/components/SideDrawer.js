"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/components/sidedrawer.module.css";

export default function SideDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut, wallet } = useMagicLink();

  const [open, setOpen] = useState(false);
  const toggleDrawer = () => setOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await signOut();
      setOpen(false);
      router.replace("/");
    } catch (err) {
      console.error("❌ Logout failed:", err.message);
      alert("Logout failed. Please try again.");
    }
  };

  useEffect(() => {
    if (user && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [user, pathname, router]);

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

  if (!user) return null;

  return (
    <>
      {/* Hamburger icon */}
      <motion.button
        className={styles.hamburger}
        onClick={toggleDrawer}
        aria-label="Open menu"
        whileTap={{ scale: 0.9 }}
      >
        <FaBars size={22} />
      </motion.button>

      {/* Side drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleDrawer}
            />
            <motion.aside
              className={`${styles.drawer} ${open ? styles.open : ""}`}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.33 }}
            >
              <div className={styles.drawerHeader}>
                <button className={styles.closeIcon} onClick={toggleDrawer}>
                  <FaTimes size={22} />
                </button>
              </div>

              <div className={styles.userBox}>
                <p className={styles.email}>
                  {user?.email || "no@email.com"}
                </p>
                <p className={styles.email}>
                  {wallet?.bnb_address || wallet?.address || "No wallet"}
                </p>
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
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <button className={styles.logout} onClick={handleLogout}>
                Logout
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
