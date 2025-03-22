"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useEffect, useState, useCallback } from "react";
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

  // Uždaro dropdown kai naviguojama
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <header className={styles.navbar} role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <Link href="/" className={styles.logoLink} aria-label="Go to homepage">
        <Image
          src="/icons/logo.png"
          alt="NordBalticum Logo"
          width={42}
          height={42}
          className={styles.logo}
          priority
          unoptimized={false}
        />
      </Link>

      {/* Desktop Nav */}
      <nav className={styles.navLinks} role="menubar">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} passHref>
            <button
              role="menuitem"
              className={`${styles.navButton} ${pathname === item.href ? styles.active : ""}`}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </button>
          </Link>
        ))}
        <button onClick={signOut} className={styles.logout} aria-label="Log out">
          Sign Out
        </button>
      </nav>

      {/* Mobile Toggle */}
      <div
        className={styles.mobileToggle}
        onClick={toggleMenu}
        aria-label="Toggle mobile menu"
        role="button"
      >
        {isOpen ? "✖" : "☰"}
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className={styles.mobileDropdown} role="menu">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <button
                className={`${styles.navButton} ${pathname === item.href ? styles.active : ""}`}
                onClick={() => setIsOpen(false)}
                role="menuitem"
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
