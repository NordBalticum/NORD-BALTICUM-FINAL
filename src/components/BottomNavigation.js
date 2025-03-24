"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "@/components/bottomnavigation.module.css";
import { FaWallet, FaClock, FaArrowDown, FaArrowUp, FaCog } from "react-icons/fa";

export default function BottomNav() {
  const router = useRouter();
  const [active, setActive] = useState("");

  useEffect(() => {
    setActive(router.pathname);
  }, [router.pathname]);

  const navItems = [
    { label: "Wallet", icon: <FaWallet />, path: "/dashboard" },
    { label: "History", icon: <FaClock />, path: "/transactions" },
    { label: "Receive", icon: <FaArrowDown />, path: "/receive" },
    { label: "Send", icon: <FaArrowUp />, path: "/send" },
    { label: "Settings", icon: <FaCog />, path: "/settings" },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`${styles.navButton} ${active === item.path ? styles.active : ""}`}
          onClick={() => router.push(item.path)}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
