"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { supabase } from "@/utils/supabaseClient"; // ✅ Tiesioginis importas
import { useAuth } from "@/contexts/AuthContext";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/history.module.css";
import background from "@/styles/background.module.css";

export default function HistoryPage() {
  const router = useRouter();
  const { user, wallet, loading: authLoading } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && !user) {
      router.replace("/");
    }
  }, [isClient, authLoading, user, router]);

  const fetchUserTransactions = useCallback(async () => {
    if (!user?.email) return;
    try {
      setLoadingTransactions(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("sender_email", user.email)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
      setError(null);
    } catch (err) {
      console.error("❌ Fetch transactions error:", err.message || err);
      setError("❌ Failed to load transactions.");
    } finally {
      setLoadingTransactions(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserTransactions();
    const interval = setInterval(fetchUserTransactions, 30000); // ✅ Kas 30s
    return () => clearInterval(interval);
  }, [fetchUserTransactions]);

  if (!isClient || authLoading) {
    return (
      <div className={styles.loading}>
        <MiniLoadingSpinner /> Loading profile...
      </div>
    );
  }

  if (!user || !wallet?.wallet?.address) {
    return (
      <div className={styles.loading}>
        <MiniLoadingSpinner /> Preparing wallet...
      </div>
    );
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>TRANSACTION HISTORY</h1>
        <p className={styles.subtext}>Your latest crypto activity</p>

        {loadingTransactions ? (
          <div className={styles.loading}>
            <MiniLoadingSpinner /> Loading transactions...
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : transactions.length === 0 ? (
          <div className={styles.loading}>No transactions found.</div>
        ) : (
          <div className={styles.transactionList}>
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.tx_hash + index}
                className={styles.transactionCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, boxShadow: "0px 0px 15px rgba(255,255,255,0.2)" }}
                transition={{ duration: 0.35, delay: index * 0.07 }}
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

// ✅ Helperiai
function truncateAddress(address) {
  if (!address || typeof address !== "string") return "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getExplorerURL(hash, network) {
  const baseURLs = {
    bsc: "https://bscscan.com/tx/",
    tbnb: "https://testnet.bscscan.com/tx/",
    eth: "https://etherscan.io/tx/",
    matic: "https://polygonscan.com/tx/",
    avax: "https://snowtrace.io/tx/",
  };
  return baseURLs[network?.toLowerCase()] + hash;
}
