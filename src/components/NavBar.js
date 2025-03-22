import Link from "next/link";
import { useRouter } from "next/router";
import { useMagicLink } from "@contexts/MagicLinkContext";
import { useState } from "react";
import styles from "@components/navbar.module.css";

export default function NavBar() {
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
    <div className={styles.navbarWrapper}>
      <div className={styles.navbarContainer}>
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

        <div className={styles.mobileMenuToggle} onClick={toggleMobileMenu}>
          {isMobileOpen ? "✖" : "☰"}
        </div>
      </div>

      {isMobileOpen && (
        <div className={styles.mobileDropdown}>
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
    </div>
  );
}
