"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { supabase } from "@/lib/supabase";

import StarsBackground from "@/components/StarsBackground";
import styles from "@/styles/history.module.css";
import background from "@/styles/background.module.css";

export default function History() {
  const { user } = useMagicLink();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(`sender_email.eq.${user.email},receiver_email.eq.${user.email}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data);
    } catch (err) {
      console.error("❌ Error fetching transactions:", err.message);
    } finally {
      setLoading(false);
    }
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
                transition={{ duration: 0.35, delay: i * 0.08 }}
              >
                <div className={styles.transactionHeader}>
                  <span className={styles.transactionType}>
                    {tx.type.toUpperCase()} • {tx.network}
                  </span>
                  <span
                    className={
                      tx.type === "receive"
                        ? styles.transactionAmountReceive
                        : styles.transactionAmountSend
                    }
                  >
                    {tx.type === "receive" ? "+" : "-"}
                    {tx.amount} {tx.network}
                  </span>
                </div>

                <p className={styles.transactionDetail}>
                  <strong>{tx.type === "receive" ? "From:" : "To:"}</strong>{" "}
                  {tx.type === "receive"
                    ? truncateAddress(tx.sender)
                    : truncateAddress(tx.receiver)}
                </p>

                <p className={styles.transactionDetail}>
                  <strong>Fee:</strong> {tx.fee} {tx.network}
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

                <a
                  href={`https://bscscan.com/tx/${tx.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.transactionLink}
                >
                  View on BscScan
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// Helper funkcija adresui trumpinti
function truncateAddress(addr) {
  if (!addr) return "Unknown";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
