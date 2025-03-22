"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useState } from "react";
import styles from "@/styles/navbar.module.css";

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

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>NordBalticum</div>

      <div className={styles.links}>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <button
              className={`${styles.linkButton} ${
                currentPath === item.href ? styles.active : ""
              }`}
            >
              {item.icon} {item.label}
            </button>
          </Link>
        ))}
        <button className={styles.logout} onClick={signOut}>
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
                className={`${styles.linkButton} ${
                  currentPath === item.href ? styles.active : ""
                }`}
                onClick={() => setIsMobileOpen(false)}
              >
                {item.icon} {item.label}
              </button>
            </Link>
          ))}
          <button className={styles.logout} onClick={signOut}>
            🚪 Logout
          </button>
        </div>
      )}
    </nav>
  );
}
