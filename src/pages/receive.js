"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext"; 
import ReceiveComponent from "@/components/ReceiveComponent"; 
import styles from "@/styles/receive.module.css";
import background from "@/styles/background.module.css";

export default function Receive() {
  const router = useRouter();
  const { user, wallet, loading } = useAuth();

  const [isClient, setIsClient] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ Check if on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  // ✅ Redirect to homepage if not logged in
  useEffect(() => {
    if (isClient && !loading && !user) {
      router.replace("/");
    }
  }, [user, loading, isClient, router]);

  const handleCopy = async () => {
    const address = wallet?.wallet?.address;
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard error:", err);
    }
  };

  if (!isClient || loading) {
    return (
      <div className={styles.loadingScreen}>
        Loading Wallet...
      </div>
    );
  }

  const address = wallet?.wallet?.address;

  if (!user || !address) {
    return (
      <div className={styles.loadingScreen}>
        Preparing wallet...
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`${styles.main} ${background.gradient}`}
    >
      <div className={styles.globalContainer}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>RECEIVE</h1>
          <p className={styles.subtext}>Your MultiNetwork Receiving Address</p>

          {/* ✅ Tik jei address */}
          <ReceiveComponent
            address={address}
            onCopy={handleCopy}
          />

          {copied && (
            <div className={styles.copied}>
              ✅ Wallet Address Copied
            </div>
          )}
        </div>
      </div>
    </motion.main>
  );
}
