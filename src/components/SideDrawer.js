"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "./sideDrawer.module.css";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

export default function SideDrawer() {
  const router = useRouter();
  const { pathname } = router;
  const { signOut } = useMagicLink();
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => setOpen(!open);

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Send", path: "/send" },
    { label: "Receive", path: "/receive" },
    { label: "Transactions", path: "/transactions" },
  ];

  if (pathname === "/") return null;

  return (
    <>
      <div className={styles.hamburger} onClick={toggleDrawer}>
        <FaBars size={22} />
      </div>

      <aside className={`${styles.drawer} ${open ? styles.open : ""}`}>
        <div className={styles.drawerHeader}>
          <FaTimes className={styles.closeIcon} onClick={toggleDrawer} />
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.link} ${pathname === item.path ? styles.active : ""}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <button className={styles.logout} onClick={signOut}>Sign Out</button>
        </nav>
      </aside>

      {open && <div className={styles.backdrop} onClick={toggleDrawer} />}
    </>
  );
}
