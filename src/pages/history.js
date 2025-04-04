"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import styles from "@/styles/history.module.css";
import background from "@/styles/background.module.css";

export default function HistoryPage() {
  const router = useRouter();
  const { user, fetchTransactions, loading } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

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

  useEffect(() => {
    const fetchUserTx = async () => {
      if (user?.email) {
        try {
          setLoadingTransactions(true);
          const txs = await fetchTransactions(user.email);
          setTransactions(txs || []);
        } catch (err) {
          console.error("❌ Failed to fetch transactions:", err);
        } finally {
          setLoadingTransactions(false);
        }
      }
    };

    fetchUserTx();
  }, [user, fetchTransactions]);

  const getExplorerURL = (hash, network) => {
    const baseURLs = {
      bsc: "https://bscscan.com/tx/",
      tbnb: "https://testnet.bscscan.com/tx/",
      eth: "https://etherscan.io/tx/",
      matic: "https://polygonscan.com/tx/",
      avax: "https://snowtrace.io/tx/",
    };
    return baseURLs[network?.toLowerCase()] + hash;
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!isClient || loading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>TRANSACTION HISTORY</h1>
        <p className={styles.subtext}>Your latest crypto activity</p>

        {loadingTransactions ? (
          <div className={styles.loading}>Loading transactions...</div>
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
                    {Number(tx.amount).toFixed(6)} {tx.network?.toUpperCase()}
                  </span>
                </div>

                <p className={styles.transactionDetail}>
                  <strong>{tx.type === "receive" ? "From:" : "To:"}</strong>{" "}
                  {truncateAddress(tx.type === "receive" ? tx.from_address : tx.to_address)}
                </p>

                <p className={styles.transactionDetail}>
                  <strong>Fee:</strong> {Number(tx.fee || 0).toFixed(6)} {tx.network?.toUpperCase()}
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

// Helper function
function truncateAddress(addr) {
  if (!addr || typeof addr !== "string") return "Unknown";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
