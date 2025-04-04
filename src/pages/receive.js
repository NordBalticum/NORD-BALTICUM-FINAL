"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext"; // ✅ Ultimate Auth
import ReceiveComponent from "@/components/ReceiveComponent"; // ✅ Naujas komponentas
import styles from "@/styles/receive.module.css";
import background from "@/styles/background.module.css";

export default function Receive() {
  const router = useRouter();
  const { user, wallet, loading } = useAuth(); // ✅ Ultimate useAuth()
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

  const handleCopy = () => {
    const address = wallet?.signers?.bnb?.address; // ✅ Teisingai traukiam adresą
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !isClient) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  if (!user || !wallet?.signers?.bnb?.address) {
    return <div className={styles.loading}>Wallet not found...</div>;
  }

  const address = wallet.signers.bnb.address; // ✅ Gražiai ištrauktas adresas

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

          {/* ✅ Receive komponentas su adresu */}
          <ReceiveComponent
            address={address}
            onCopy={handleCopy}
          />

          {copied && <div className={styles.copied}>Wallet Address Copied</div>}
        </div>
      </div>
    </motion.main>
  );
          }
