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
      aria-label="Bottom Navigation"
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
              <div className={styles.icon}>{icon}</div>
              <span className={styles.label}>{label}</span>
            </a>
          </Link>
        );
      })}
    </nav>
  );
}
