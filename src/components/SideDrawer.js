"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import AvatarDisplay from "@/components/AvatarDisplay";
import { FaBars, FaTimes } from "react-icons/fa";
import styles from "@/components/sidedrawer.module.css";

export default function SideDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useMagicLink();
  const { wallet } = useWallet();

  const [open, setOpen] = useState(false);

  const toggleDrawer = () => setOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await signOut();
      setOpen(false);
      router.replace("/");
    } catch (err) {
      console.error("❌ Logout failed:", err.message);
      alert("Logout failed. Please try again.");
    }
  };

  // Prevent scroll lag and improve open animation smoothness
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Send", path: "/send" },
    { label: "Receive", path: "/receive" },
    { label: "History", path: "/history" },
  ];

  if (pathname === "/") return null;

  return (
    <>
      <button
        className={styles.hamburger}
        onClick={toggleDrawer}
        aria-label="Open menu"
      >
        <FaBars size={22} />
      </button>

      <aside
        className={`${styles.drawer} ${open ? styles.open : ""}`}
        role="navigation"
        aria-label="Sidebar Navigation"
      >
        <div className={styles.drawerHeader}>
          <button
            className={styles.closeIcon}
            onClick={toggleDrawer}
            aria-label="Close menu"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className={styles.userBox}>
          <AvatarDisplay walletAddress={wallet?.address} size={64} />
          <p className={styles.email}>{user?.email || "Not logged in"}</p>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link key={item.path} href={item.path} legacyBehavior>
              <a
                className={`${styles.link} ${pathname === item.path ? styles.active : ""}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            </Link>
          ))}

          <button className={styles.logout} onClick={handleLogout}>
            Sign Out
          </button>
        </nav>
      </aside>

      {open && <div className={styles.backdrop} onClick={toggleDrawer} />}
    </>
  );
}
