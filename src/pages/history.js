"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/lib/supabaseClient";

import BottomNavigation from "@/components/BottomNavigation";
import styles from "@/styles/history.module.css";

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { wallet } = useWallet();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Redirect if not logged in
  useEffect(() => {
    if (!user) router.push("/");
  }, [user]);

  // Fetch transactions from Supabase
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("sender_email", user.email)
          .order("date", { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error("❌ Error fetching transactions:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  // Filter transactions by type
  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((tx) => tx.type === filter);
  }, [transactions, filter]);

  if (!user) return null;

  return (
    <div className="globalContainer">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Transaction History</h1>
        <p className={styles.subtext}>All your recent blockchain activity</p>

        <div className={styles.filters}>
          {["all", "send", "receive", "stake"].map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.active : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={styles.loading}>Loading your transactions...</p>
        ) : filteredTransactions.length > 0 ? (
          <div className={styles.list}>
            {filteredTransactions.map((tx, index) => (
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
                  <span className={styles.value}>
                    {tx.receiver_address || "—"}
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Status:</span>
                  <span
                    className={
                      tx.status === "success" ? styles.success : styles.pending
                    }
                  >
                    {tx.status}
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Date:</span>
                  <span className={styles.value}>
                    {new Date(tx.date).toLocaleDateString()}{" "}
                    {new Date(tx.date).toLocaleTimeString()}
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Hash:</span>
                  <span className={styles.value}>{tx.tx_hash}</span>
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
