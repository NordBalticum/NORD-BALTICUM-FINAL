"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaUserCircle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import styles from "@/components/bottomnav.module.css";

const navItems = [
  { path: "/dashboard", icon: <FaWallet />, label: "Wallet" },
  { path: "/send", icon: <FaArrowUp />, label: "Send" },
  { path: "/receive", icon: <FaArrowDown />, label: "Receive" },
  { path: "/history", icon: <FaClock />, label: "History" },
  { path: "/settings", icon: <FaUserCircle />, label: "Settings" },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.nav
        key={pathname}
        className={styles.navbar}
        role="navigation"
        aria-label="Bottom Navigation"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      >
        {navItems.map(({ path, icon, label }) => {
          const isActive = pathname === path;

          return (
            <Link key={path} href={path} legacyBehavior>
              <a
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
              >
                <motion.div
                  className={styles.icon}
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {icon}
                </motion.div>
                <span className={styles.label}>{label}</span>
              </a>
            </Link>
          );
        })}
      </motion.nav>
    </AnimatePresence>
  );
}
