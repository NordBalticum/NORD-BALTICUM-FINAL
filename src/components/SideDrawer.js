"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import Image from "next/image";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import styles from "@/components/sidedrawer.module.css";

export default function SideDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut, wallet } = useMagicLink();

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

  useEffect(() => {
    if (user && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [user, pathname, router]);

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

  const walletAddress = wallet?.bnb || "No wallet";
  
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
                <button className={styles.closeIcon} onClick={toggleDrawer}>
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
                    transition: "transform 0.4s ease",
                  }}
                />

                <p className={styles.email}>
                  {user?.email || "no@email.com"}
                </p>

                <div
                  onClick={() => {
                    if (walletAddress && walletAddress !== "No wallet") {
                      navigator.clipboard.writeText(walletAddress);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    }
                  }}
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "16px",
                    boxShadow: "0 4px 24px rgba(255, 255, 255, 0.08)",
                    backdropFilter: "blur(14px)",
                    textAlign: "center",
                    fontFamily: "Share Tech Mono, monospace",
                    width: "100%",
                    wordBreak: "break-all",
                    border: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.3s ease",
                  }}
                  title="Click to copy"
                >
                  {copied && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      style={{
                        position: "absolute",
                        top: "-24px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: "0.7rem",
                        color: "#ffd700",
                        background: "rgba(255,255,255,0.05)",
                        padding: "2px 10px",
                        borderRadius: "10px",
                        backdropFilter: "blur(8px)",
                        fontWeight: 500,
                      }}
                    >
                      Copied!
                    </motion.div>
                  )}
                  <p style={{ fontSize: "0.7rem", color: "#aaa", marginBottom: "6px" }}>
                    Your wallet:
                  </p>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "#fff",
                      opacity: 0.95,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {walletAddress}
                  </p>
                </div>
              </div>

              {/* NAVIGATION + LOGOUT moved higher */}
              <div style={{ marginTop: "32px" }}>
                <nav className={styles.nav}>
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.path}
                      className={`${styles.link} ${
                        pathname === item.path ? styles.active : ""
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div style={{ marginTop: "16px" }}>
                  <button className={styles.logout} onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
