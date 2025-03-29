"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { supabase } from "@/lib/supabase";
import BottomNavigation from "@/components/BottomNavigation";

import styles from "@/styles/history.module.css";

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
      console.error("❌ Klaida gaunant transakcijas:", err);
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>TRANSAKCIJŲ ISTORIJA</h1>
        <p className={styles.subtext}>Jūsų naujausia veikla</p>

        {loading ? (
          <div className={styles.loading}>Kraunama istorija...</div>
        ) : transactions.length === 0 ? (
          <div className={styles.loading}>Transakcijų nėra.</div>
        ) : (
          <div className={styles.transactionList}>
            {transactions.map((tx, i) => (
              <motion.div
                key={tx.tx_hash}
                className={styles.transactionCard}
                variants={variants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.3, delay: i * 0.07 }}
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
                  <strong>{tx.type === "receive" ? "Nuo:" : "Kam:"}</strong>{" "}
                  {tx.type === "receive"
                    ? `${tx.sender?.slice(0, 6)}...${tx.sender?.slice(-4)}`
                    : `${tx.receiver?.slice(0, 6)}...${tx.receiver?.slice(-4)}`}
                </p>

                <p className={styles.transactionDetail}>
                  <strong>Mokestis:</strong> {tx.fee} {tx.network}
                </p>

                <p className={styles.transactionDate}>
                  {new Date(tx.created_at).toLocaleString("lt-LT")}
                </p>

                <a
                  href={`https://bscscan.com/tx/${tx.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.transactionLink}
                >
                  Peržiūrėti transakciją
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
