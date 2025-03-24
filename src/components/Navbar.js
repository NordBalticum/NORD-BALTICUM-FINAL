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
    setIsOpen(false); // auto close on route change
  }, [pathname]);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  if (pathname === "/") return null;

  return (
    <header className={styles.navbar} role="navigation" aria-label="Main navigation">
      <div className={styles.navContent}>
        {/* === Logo === */}
        <Link href="/" className={styles.logoLink} aria-label="Go to homepage">
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum Logo"
            width={56}
            height={56}
            className={styles.logo}
            priority
          />
        </Link>

        {/* === Desktop Links === */}
        <nav className={styles.navLinks} role="menubar" aria-label="Desktop navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <button
                role="menuitem"
                className={`${styles.navButton} ${pathname === item.href ? styles.active : ""}`}
              >
                {item.label}
              </button>
            </Link>
          ))}
          <button onClick={signOut} className={styles.logout} aria-label="Log out">
            Sign Out
          </button>
        </nav>

        {/* === Mobile Toggle === */}
        <div
          className={`${styles.mobileToggle} ${isOpen ? styles.open : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle mobile menu"
          role="button"
        >
          <span />
          <span />
        </div>
      </div>

      {/* === Mobile Dropdown === */}
      {isOpen && (
        <div className={styles.mobileDropdown} role="menu" aria-label="Mobile menu">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <button
                role="menuitem"
                className={`${styles.navButton} ${pathname === item.href ? styles.active : ""}`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </button>
            </Link>
          ))}
          <button
            onClick={signOut}
            className={styles.logoutMobile}
            aria-label="Log out from mobile"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
