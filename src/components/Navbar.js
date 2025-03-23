"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { AnimatePresence, motion } from "framer-motion";
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

  useEffect(() => setIsOpen(false), [pathname]);

  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);

  if (pathname === "/") return null;

  return (
    <header className={styles.navbar}>
      <div className={styles.navContent}>
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum Logo"
            width={54}
            height={54}
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.mobileDropdown}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
