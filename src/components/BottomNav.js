"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { FaWallet, FaHistory, FaArrowDown, FaArrowUp } from "react-icons/fa";
import styles from "./bottomNav.module.css";

export default function BottomNav() {
  const { pathname } = useRouter();

  const navItems = [
    { icon: <FaWallet />, label: "Dashboard", path: "/dashboard" },
    { icon: <FaArrowUp />, label: "Send", path: "/send" },
    { icon: <FaArrowDown />, label: "Receive", path: "/receive" },
    { icon: <FaHistory />, label: "History", path: "/transactions" },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => (
        <Link key={item.path} href={item.path} className={styles.navItem}>
          <div className={`${styles.iconWrapper} ${pathname === item.path ? styles.active : ""}`}>
            {item.icon}
          </div>
          <span className={styles.label}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
