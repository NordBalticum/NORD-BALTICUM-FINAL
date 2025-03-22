"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useState } from "react";
import Image from "next/image";
import styles from "@/components/navbar.module.css";

export default function Navbar() {
  const { signOut } = useMagicLink();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const currentPath = router.pathname;

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Send", href: "/send" },
    { label: "Receive", href: "/receive" },
  ];

  return (
    <header className={styles.navbar} role="navigation" aria-label="Main Navigation">
      <div className={styles.navbarInner}>
        <Link href="/" className={styles.logoLink} aria-label="Go to homepage">
          <Image
            src="/icons/logo.png"
            alt="NordBalticum Logo"
            width={38}
            height={38}
            className={styles.logo}
            priority
          />
        </Link>

        <nav className={styles.navLinks}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={`${styles.navButton} ${
                  currentPath === item.href ? styles.active : ""
                }`}
                aria-label={`Navigate to ${item.label}`}
              >
                {item.label}
              </button>
            </Link>
          ))}
          <button onClick={signOut} className={styles.logout} aria-label="Sign out">
            Sign Out
          </button>
        </nav>

        <div
          className={styles.mobileToggle}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle mobile menu"
        >
          {isOpen ? "✖" : "☰"}
        </div>
      </div>

      {isOpen && (
        <div className={styles.mobileDropdown}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={`${styles.navButton} ${
                  currentPath === item.href ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </button>
            </Link>
          ))}
          <button onClick={signOut} className={styles.logoutMobile}>
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
