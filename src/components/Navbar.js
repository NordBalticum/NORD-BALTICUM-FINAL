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
  const currentPath = router.pathname;
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Send", href: "/send" },
    { label: "Receive", href: "/receive" },
  ];

  return (
    <header className={styles.navbar}>
      {/* Logo */}
      <Link href="/" className={styles.logoLink}>
        <Image
          src="/icons/logo.png"
          alt="Logo"
          width={42}
          height={42}
          className={styles.logo}
        />
      </Link>

      {/* Desktop Menu */}
      <nav className={styles.navLinks}>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <button
              className={`${styles.navButton} ${
                currentPath === item.href ? styles.active : ""
              }`}
            >
              {item.label}
            </button>
          </Link>
        ))}
        <button onClick={signOut} className={styles.logout}>
          Sign Out
        </button>
      </nav>

      {/* Hamburger */}
      <div className={styles.mobileToggle} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "✖" : "☰"}
      </div>

      {/* Mobile Dropdown */}
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
