"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useState } from "react";
import styles from "@/components/navbar.module.css";

export default function Navbar() {
  const { signOut } = useMagicLink();
  const router = useRouter();
  const currentPath = router.pathname;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: "🏠" },
    { label: "Send", href: "/send", icon: "📤" },
    { label: "Receive", href: "/receive", icon: "📥" },
  ];

  const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

  return (
    <nav className={styles.navbarWrapper}>
      <Link href="/">
        <Image
          src="/icons/logo.png"
          alt="NordBalticum"
          className={styles.logo}
          width={120}
          height={36}
        />
      </Link>

      <div className={styles.desktopMenu}>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <button
              className={`${styles.navButton} ${
                currentPath === item.href ? styles.active : ""
              }`}
            >
              {item.icon} {item.label}
            </button>
          </Link>
        ))}
        <button className={styles.logoutButton} onClick={signOut}>
          🚪 Logout
        </button>
      </div>

      <div className={styles.mobileToggle} onClick={toggleMobileMenu}>
        {isMobileOpen ? "✖" : "☰"}
      </div>

      {isMobileOpen && (
        <div className={styles.mobileMenu}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={`${styles.navButton} ${
                  currentPath === item.href ? styles.active : ""
                }`}
                onClick={() => setIsMobileOpen(false)}
              >
                {item.icon} {item.label}
              </button>
            </Link>
          ))}
          <button className={styles.logoutButton} onClick={signOut}>
            🚪 Logout
          </button>
        </div>
      )}
    </nav>
  );
}
