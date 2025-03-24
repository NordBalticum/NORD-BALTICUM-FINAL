"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/components/navbar.module.css";

export default function Navbar() {
  const router = useRouter();
  const { pathname } = router;
  const { signOut } = useMagicLink();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Send", href: "/send" },
    { label: "Receive", href: "/receive" },
  ];

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  if (pathname === "/") return null;

  return (
    <header className={styles.navbar} role="navigation">
      <div className={styles.navContent}>
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum Logo"
            width={56}
            height={56}
            className={styles.logo}
            priority
          />
        </Link>

        <nav className={styles.navLinks}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <button
                className={`${styles.navButton} ${pathname === item.href ? styles.active : ""}`}
              >
                {item.label}
              </button>
            </Link>
          ))}
          <button onClick={signOut} className={styles.logout}>Sign Out</button>
        </nav>

        <div
          className={`${styles.mobileToggle} ${isOpen ? styles.open : ""}`}
          onClick={toggleMenu}
        >
          <span />
          <span />
        </div>
      </div>

      {isOpen && (
        <div className={styles.mobileDropdown}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <button
                className={`${styles.navButton} ${pathname === item.href ? styles.active : ""}`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </button>
            </Link>
          ))}
          <button onClick={signOut} className={styles.logoutMobile}>Sign Out</button>
        </div>
      )}
    </header>
  );
}
