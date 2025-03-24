"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/components/sidedrawer.module.css";

export default function SideDrawer() {
  const { signOut } = useMagicLink();
  const router = useRouter();
  const { pathname } = router;

  const [open, setOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Send", href: "/send" },
    { label: "Receive", href: "/receive" },
  ];

  if (pathname === "/") return null;

  return (
    <>
      <div className={styles.hamburger} onClick={() => setOpen(!open)} aria-label="Toggle menu">
        <span />
        <span />
        <span />
      </div>

      <aside className={`${styles.drawer} ${open ? styles.open : ""}`}>
        <div className={styles.header}>
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum Logo"
            width={48}
            height={48}
            className={styles.logo}
            onClick={() => router.push("/dashboard")}
          />
          <button className={styles.closeBtn} onClick={() => setOpen(false)}>×</button>
        </div>

        <nav className={styles.menu}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <button
                className={`${styles.menuItem} ${pathname === item.href ? styles.active : ""}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </button>
            </Link>
          ))}
        </nav>

        <button onClick={signOut} className={styles.signout}>Sign Out</button>
      </aside>
    </>
  );
}
