"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceContext";
import BottomNavigation from "@/components/BottomNavigation";
import styles from "@/styles/history.module.css";

export default function HistoryPage() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const { transactions } = useBalance();

  useEffect(() => {
    if (!user || !wallet) {
      router.push("/");
    }
  }, [user, wallet]);

  if (!user || !wallet) return null;

  return (
    <div className="globalContainer">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Transaction History</h1>

        {transactions && transactions.length > 0 ? (
          <div className={styles.list}>
            {transactions.map((tx, index) => (
              <div key={index} className={styles.card}>
                <div className={styles.row}>
                  <span className={styles.label}>Type:</span>
                  <span className={styles.value}>{tx.type}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Amount:</span>
                  <span className={styles.value}>
                    {tx.amount} {tx.currency}
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>To:</span>
                  <span className={styles.value}>{tx.to}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Date:</span>
                  <span className={styles.value}>
                    {new Date(tx.date).toLocaleString()}
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Status:</span>
                  <span
                    className={
                      tx.status === "success"
                        ? styles.success
                        : styles.error
                    }
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No transactions found.</p>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}
