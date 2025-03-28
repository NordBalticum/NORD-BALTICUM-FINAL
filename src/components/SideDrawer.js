"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "@/components/sidedrawer.module.css";
import AvatarDisplay from "@/components/AvatarDisplay";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

export default function SideDrawer() {
  const router = useRouter();
  const { logout, user, wallet } = useAuth(); // ✅ Naudojam AuthContext
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => setOpen(!open);

  const handleLogout = async () => {
    try {
      await logout();
      setOpen(false);
      router.replace("/");
    } catch (err) {
      console.error("❌ Logout failed:", err.message);
      alert("Logout failed. Please try again.");
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Send", path: "/send" },
    { label: "Receive", path: "/receive" },
    { label: "History", path: "/history" },
  ];

  if (typeof window !== "undefined" && window.location.pathname === "/") return null;

  return (
    <>
      <button className={styles.hamburger} onClick={toggleDrawer} aria-label="Open menu">
        <FaBars size={22} />
      </button>

      <aside
        className={`${styles.drawer} ${open ? styles.open : ""}`}
        role="navigation"
        aria-label="Side navigation"
      >
        <div className={styles.drawerHeader}>
          <FaTimes
            className={styles.closeIcon}
            onClick={toggleDrawer}
            aria-label="Close menu"
          />
        </div>

        <div className={styles.userBox}>
          <AvatarDisplay walletAddress={wallet?.address} size={64} />
          <p className={styles.email}>{user?.email || "Not logged in"}</p>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.link} ${
                typeof window !== "undefined" && window.location.pathname === item.path
                  ? styles.active
                  : ""
              }`}
              onClick={() => setOpen(false)}
            >
              {item.label}
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
