"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabaseClient";

import { useSystem } from "@/contexts/SystemContext";

import styles from "@/styles/history.module.css";
import background from "@/styles/background.module.css";

export default function History() {
  const { user, wallet } = useSystem();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email && wallet?.address) fetchTransactions();
  }, [user, wallet]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(
          `sender_email.eq.${user.email},receiver_email.eq.${user.email},wallet_address.eq.${wallet.address}`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data);
    } catch (err) {
      console.error("❌ Error fetching transactions:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const getExplorerURL = (hash, network) => {
    const baseURLs = {
      bsc: "https://bscscan.com/tx/",
      tbnb: "https://testnet.bscscan.com/tx/",
      ethereum: "https://etherscan.io/tx/",
      polygon: "https://polygonscan.com/tx/",
      avalanche: "https://snowtrace.io/tx/",
    };
    return baseURLs[network?.toLowerCase()] + hash;
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <StarsBackground />

      <div className={styles.wrapper}>
        <h1 className={styles.title}>TRANSACTION HISTORY</h1>
        <p className={styles.subtext}>Your latest crypto activity</p>

        {loading ? (
          <div className={styles.loading}>Loading your transactions...</div>
        ) : transactions.length === 0 ? (
          <div className={styles.loading}>No transactions found.</div>
        ) : (
          <div className={styles.transactionList}>
            {transactions.map((tx, i) => (
              <motion.div
                key={tx.tx_hash + i}
                className={styles.transactionCard}
                variants={variants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.35, delay: i * 0.07 }}
              >
                <div className={styles.transactionHeader}>
                  <span className={styles.transactionType}>
                    {tx.type?.toUpperCase()} • {tx.network?.toUpperCase()}
                  </span>
                  <span
                    className={
                      tx.type === "receive"
                        ? styles.transactionAmountReceive
                        : styles.transactionAmountSend
                    }
                  >
                    {tx.type === "receive" ? "+" : "-"}
                    {tx.amount} {tx.network?.toUpperCase()}
                  </span>
                </div>

                <p className={styles.transactionDetail}>
                  <strong>{tx.type === "receive" ? "From:" : "To:"}</strong>{" "}
                  {tx.type === "receive"
                    ? truncateAddress(tx.from_address)
                    : truncateAddress(tx.to_address)}
                </p>

                <p className={styles.transactionDetail}>
                  <strong>Fee:</strong> {tx.fee || "0"} {tx.network}
                </p>

                <p className={styles.transactionDate}>
                  {new Date(tx.created_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {tx.tx_hash && (
                  <a
                    href={getExplorerURL(tx.tx_hash, tx.network)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.transactionLink}
                  >
                    View on Explorer
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// Helper
function truncateAddress(addr) {
  if (!addr || typeof addr !== "string") return "Unknown";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
