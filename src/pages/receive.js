"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext"; // ✅ Ultimate Auth Context
import ReceiveComponent from "@/components/ReceiveComponent"; // ✅ Receive Component
import styles from "@/styles/receive.module.css";
import background from "@/styles/background.module.css";

export default function Receive() {
  const router = useRouter();
  const { user, wallet, loading } = useAuth(); // ❌ No loadOrCreateWallet čia
  const [isClient, setIsClient] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ Detect client-side
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

  // ✅ Copy wallet address
  const handleCopy = () => {
    const address = wallet?.signers?.bnb?.address;
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isClient || loading) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  if (!user || !wallet?.wallet?.address) {
    return <div className={styles.loading}>Preparing wallet...</div>; // ✅ Saugus paruošimas
  }

  const address = wallet.signers.bnb.address;

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

          {/* ✅ Receive komponentas */}
          <ReceiveComponent
            address={address}
            onCopy={handleCopy}
          />

          {copied && (
            <div className={styles.copied}>
              Wallet Address Copied
            </div>
          )}
        </div>
      </div>
    </motion.main>
  );
}
