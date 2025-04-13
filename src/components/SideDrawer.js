"use client";

// 1️⃣ IMPORTAI
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaBars } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styles from "@/components/sidedrawer.module.css";

export default function SideDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, wallet, signOut, authLoading, walletLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 2️⃣ DETECT CLIENT
  useEffect(() => {
    setIsClient(typeof window !== "undefined");
  }, []);

  // 3️⃣ LOCK SCROLL KAI DRAWER ATIDARYTAS
  useEffect(() => {
    if (!isClient) return;
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open, isClient]);

  // 4️⃣ TOGGLE DRAWER
  const toggleDrawer = () => setOpen((prev) => !prev);

  // 5️⃣ LOGOUT
  const handleLogout = async () => {
    try {
      await signOut(true); // ✅ Siunčiam true kad parodytų logout toast
      setOpen(false);
      document.body.style.overflow = "auto";
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error.message || error);
    }
  };

  // 6️⃣ NAVIGACIJOS NUORODOS
  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Send", path: "/send" },
    { label: "Receive", path: "/receive" },
    { label: "History", path: "/history" },
    { label: "Settings", path: "/settings" },
  ];

  // 7️⃣ JEI USER AR WALLET NĖRA → NERODYTI
  if (!isClient || authLoading || walletLoading || !user || !wallet?.wallet?.address) {
    return null;
  }

  // 8️⃣ UI
  return (
    <>
      {/* ✅ Hamburger Button */}
      <motion.button
        className={styles.hamburger}
        onClick={toggleDrawer}
        aria-label="Open Menu"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <FaBars size={22} />
      </motion.button>

      {/* ✅ AnimatePresence su mode="wait" */}
      <AnimatePresence mode="wait">
        {open && (
          <>
            {/* ✅ Backdrop */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              onClick={toggleDrawer}
            />

            {/* ✅ Drawer */}
            <motion.aside
              className={`${styles.drawer} ${open ? styles.open : ""}`}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            >
              {/* ✅ Header */}
              <div className={styles.drawerHeader}>
                <motion.button
                  className={styles.closeIcon}
                  onClick={toggleDrawer}
                  aria-label="Close Menu"
                  whileHover={{ rotate: 90 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <FaTimes size={22} />
                </motion.button>
              </div>

              {/* ✅ User Info */}
              <motion.div
                className={styles.userBox}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <img
                  src="/icons/logo.svg"
                  alt="NordBalticum Logo"
                  className={styles.logo}
                  width={120}
                  height={40}
                />
                <motion.p
                  className={styles.email}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {user?.email || "User"}
                </motion.p>
              </motion.div>

              {/* ✅ Navigation */}
              <nav className={styles.nav}>
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  >
                    <Link
                      href={item.path}
                      className={`${styles.link} ${pathname === item.path ? styles.active : ""}`}
                      onClick={() => setOpen(false)}
                      aria-current={pathname === item.path ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* ✅ Logout Button */}
              <motion.button
                className={styles.logout}
                onClick={handleLogout}
                aria-label="Logout"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                Logout
              </motion.button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
