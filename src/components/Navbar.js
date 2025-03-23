"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { motion, AnimatePresence } from "framer-motion";
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

  // ✅ Nerodyti ant pagrindinio puslapio
  if (pathname === "/") return null;

  return (
    <header className={styles.navbar} role="navigation" aria-label="Main navigation">
      <div className={styles.navContent}>
        {/* ✅ Logo */}
        <Link href="/" className={styles.logoLink} aria-label="Go to homepage">
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum Logo"
            width={54}
            height={54}
            className={styles.logo}
            priority
          />
        </Link>

        {/* ✅ Desktop Navigacija */}
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

        {/* ✅ Mobile Toggle */}
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

      {/* ✅ Animated Mobile Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.mobileDropdown}
            role="menu"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
