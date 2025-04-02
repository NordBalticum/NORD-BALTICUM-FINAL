"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import Image from "next/image";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { utils } from "ethers";
import styles from "@/components/sidedrawer.module.css";

export default function SideDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useMagicLink();
  const { wallet } = useWallet();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const walletAddress = wallet?.bnb && utils.isAddress(wallet.bnb)
    ? wallet.bnb
    : "No wallet";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Send", path: "/send" },
    { label: "Receive", path: "/receive" },
    { label: "History", path: "/history" },
    { label: "Settings", path: "/settings" },
  ];

  if (!user) return null;

  return (
    <>
      <motion.button
        className={styles.hamburger}
        onClick={toggleDrawer}
        aria-label="Open menu"
        whileTap={{ scale: 0.9 }}
      >
        <FaBars size={22} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleDrawer}
            />
            <motion.aside
              className={`${styles.drawer} ${open ? styles.open : ""}`}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.33 }}
            >
              <div className={styles.drawerHeader}>
                <button
                  className={styles.closeIcon}
                  onClick={toggleDrawer}
                  aria-label="Close menu"
                >
                  <FaTimes size={22} />
                </button>
              </div>

              <div className={styles.userBox}>
                <Image
                  src="/icons/logo.svg"
                  alt="NordBalticum Logo"
                  width={240}
                  height={80}
                  priority
                  style={{
                    marginBottom: "18px",
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.15)",
                    padding: "8px",
                    background:
                      "radial-gradient(circle at center, rgba(255,255,255,0.06), transparent)",
                    boxShadow: "0 0 28px rgba(255,255,255,0.08)",
                  }}
                />
                <p className={styles.email}>{user?.email}</p>

                <div
                  title="Click to copy"
                  onClick={() => {
                    if (utils.isAddress(walletAddress)) {
                      navigator.clipboard.writeText(walletAddress);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1600);
                    }
                  }}
                  className={styles.walletBox}
                >
                  {copied && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className={styles.copiedText}
                    >
                      Copied!
                    </motion.div>
                  )}
                  <p className={styles.walletLabel}>Your wallet:</p>
                  <p className={styles.walletAddress}>{walletAddress}</p>
                </div>
              </div>

              <div className={styles.navSection}>
                <nav className={styles.nav}>
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.path}
                      onClick={() => setOpen(false)}
                      className={`${styles.link} ${
                        pathname === item.path ? styles.active : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <button
                  className={styles.logout}
                  onClick={handleLogout}
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
