"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { supabase } from "@/utils/supabaseClient";

import { useAuth } from "@/contexts/AuthContext"; 
import styles from "@/styles/receive.module.css";
import background from "@/styles/background.module.css";

export default function Receive() {
  const router = useRouter();
  const { user, wallet, loading } = useAuth();

  const [isClient, setIsClient] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (isClient && !loading && !user) {
      router.replace("/");
    }
  }, [user, loading, isClient, router]);

  const handleCopy = async (address) => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard error:", err);
    }
  };

  useEffect(() => {
    if (!wallet?.wallet?.address) return;

    // Real-Time Receive Monitoring
    const subscription = supabase
      .channel('realtime:transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        const { new: tx } = payload;
        if (tx?.receiver_address?.toLowerCase() === wallet.wallet.address.toLowerCase()) {
          console.log("✅ New Incoming Transaction Received:", tx);
          // Galima būtų rodyti "Transaction Received!" notification (bonus)
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [wallet]);

  if (!isClient || loading) {
    return <div className={styles.loadingScreen}>Loading Wallet...</div>;
  }

  const address = wallet?.wallet?.address;

  if (!user || !address) {
    return <div className={styles.loadingScreen}>Preparing wallet...</div>;
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`${styles.main} ${background.gradient}`}
    >
      <div className={styles.globalContainer}>
        <motion.div
          className={styles.wrapper}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            padding: "2rem",
          }}
        >
          <h1 className={styles.title}>RECEIVE</h1>
          <p className={styles.subtext}>Your MultiNetwork Receiving Address</p>

          {/* ✅ QR Code */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={styles.qrWrapper}
            onClick={() => handleCopy(address)}
            style={{
              padding: "1rem",
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.02)",
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
            }}
          >
            <QRCode
              value={address}
              size={180}
              bgColor="transparent"
              fgColor="#ffffff"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </motion.div>

          {/* ✅ Wallet Address */}
          <p className={styles.addressText}>
            {address}
          </p>

          {/* ✅ Copy Button */}
          <motion.button
            onClick={() => handleCopy(address)}
            className={styles.copyButton}
            whileHover={{ scale: 1.05 }}
          >
            {copied ? "Copied!" : "Copy Address"}
          </motion.button>

          {/* ✅ Small Copied Success */}
          {copied && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={styles.copied}
            >
              ✅ Wallet Address Copied
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.main>
  );
}
