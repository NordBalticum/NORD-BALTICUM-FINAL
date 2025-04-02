"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { FaBars, FaTimes } from "react-icons/fa";
import styles from "@/components/sidedrawer.module.css";

export default function SideDrawer() {
  const router = useRouter();
  const { user, signOut, wallet } = useMagicLink();

  const [open, setOpen] = useState(false);
  const toggleDrawer = () => setOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await signOut();
      setOpen(false);
      setTimeout(() => router.replace("/"), 200);
    } catch (err) {
      console.error("❌ Logout failed:", err.message);
      alert("Logout failed. Please try again.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") setOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Send", path: "/send" },
    { label: "Receive", path: "/receive" },
    { label: "History", path: "/history" },
    { label: "Settings", path: "/settings" },
  ];

  const shortenAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  if (!user) return null;

  return (
    <>
      <motion.button
        className={styles.hamburger}
        onClick={toggleDrawer}
        aria-label="Open menu"
        title="Open menu"
        whileTap={{ scale: 0.9 }}
      >
        <FaBars size={22} />
      </motion.button>

      <AnimatePresence>
        {open && (
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
                title="Close"
              >
                <FaTimes size={22} />
              </button>
              <p className={styles.address}>
                {shortenAddress(wallet?.address)}
              </p>
            </div>
            <nav className={styles.nav}>
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.path}
                  onClick={() => setOpen(false)}
                  title={item.label}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <button className={styles.logout} onClick={handleLogout}>
              Logout
            </button>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
