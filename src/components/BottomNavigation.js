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
    <nav
      className={styles.navbar}
      role="navigation"
      aria-label="Bottom Navigation Bar"
    >
      {navItems.map(({ path, icon, label }) => {
        const isActive = pathname === path;
        return (
          <Link key={path} href={path} passHref legacyBehavior>
            <button
              type="button"
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              aria-label={label}
            >
              <div className={styles.icon}>{icon}</div>
              <span className={styles.label}>{label}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}
