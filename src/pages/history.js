"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/utils/supabaseClient";
import { scanBlockchain } from "@/utils/scanBlockchain";
import { useAuth } from "@/contexts/AuthContext";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import { toast } from "react-hot-toast";
import styles from "@/styles/history.module.css";
import background from "@/styles/background.module.css";

export default function HistoryPage() {
  const router = useRouter();
  const { user, wallet, loading: authLoading } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [filterNetwork, setFilterNetwork] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [lastSynced, setLastSynced] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && !user) {
      router.replace("/");
    }
  }, [isClient, authLoading, user, router]);

  const fetchUserTransactions = useCallback(async () => {
    if (!user?.email || !wallet?.wallet?.address) return;
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(`user_email.eq.${user.email},sender_address.eq.${wallet.wallet.address},receiver_address.eq.${wallet.wallet.address}`)
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
  }, [user, wallet]);

  useEffect(() => {
    const syncAndFetch = async () => {
      try {
        toast.loading("Syncing blockchain...", { id: "sync" });
        await scanBlockchain(wallet.wallet.address, user.email);
        await fetchUserTransactions();
        setLastSynced(new Date().toLocaleString());
        toast.success("Blockchain synced!", { id: "sync" });
      } catch (error) {
        console.error(error);
        toast.error("Failed to sync blockchain.", { id: "sync" });
      }
    };

    if (user && wallet?.wallet?.address) {
      syncAndFetch();
    }
  }, [user, wallet, fetchUserTransactions]);

  const filteredTransactions = transactions.filter((tx) => {
    const networkMatch = filterNetwork === "All" || tx.network === filterNetwork;
    const statusMatch = filterStatus === "All" || tx.status === filterStatus;
    return networkMatch && statusMatch;
  });

  const renderStatusBadge = (status) => {
    if (status === "completed") return <span style={{ color: "limegreen" }}>✔️ Completed</span>;
    if (status === "pending") return <span style={{ color: "orange" }}>⏳ Pending</span>;
    return <span style={{ color: "red" }}>❌ Failed</span>;
  };

  const getNetworkLogo = (network) => {
    switch (network) {
      case "bnb":
      case "tbnb":
        return "https://cryptologos.cc/logos/binance-coin-bnb-logo.png";
      case "eth":
        return "https://cryptologos.cc/logos/ethereum-eth-logo.png";
      case "polygon":
        return "https://cryptologos.cc/logos/polygon-matic-logo.png";
      case "avax":
        return "https://cryptologos.cc/logos/avalanche-avax-logo.png";
      default:
        return "https://cryptologos.cc/logos/question-mark.svg";
    }
  };

  if (!isClient || authLoading) {
    return <div className={styles.loading}><MiniLoadingSpinner /> Loading profile...</div>;
  }

  if (!user || !wallet?.wallet?.address) {
    return <div className={styles.loading}><MiniLoadingSpinner /> Preparing wallet...</div>;
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>TRANSACTION HISTORY</h1>
        <p className={styles.subtext}>Your latest crypto activity</p>
        {lastSynced && (
          <p style={{ color: "#888", marginBottom: "1rem", fontSize: "0.9rem" }}>
            Last Synced: {lastSynced}
          </p>
        )}

        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "2rem" }}>
          <select
            value={filterNetwork}
            onChange={(e) => setFilterNetwork(e.target.value)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "10px",
              border: "1px solid #444",
              backgroundColor: "#0a0a0a",
              color: "#fff",
              fontSize: "0.9rem",
            }}
          >
            <option value="All">All Networks</option>
            <option value="bnb">BNB Mainnet</option>
            <option value="tbnb">BNB Testnet</option>
            <option value="eth">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="avax">Avalanche</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "10px",
              border: "1px solid #444",
              backgroundColor: "#0a0a0a",
              color: "#fff",
              fontSize: "0.9rem",
            }}
          >
            <option value="All">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {loadingTransactions ? (
          <div className={styles.loading}><MiniLoadingSpinner /> Loading transactions...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : filteredTransactions.length === 0 ? (
          <div className={styles.loading}>No transactions found.</div>
        ) : (
          <div className={styles.transactionList}>
            <AnimatePresence>
              {filteredTransactions.map((tx, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  className={styles.transactionCard}
                  whileHover={{ scale: 1.03 }}
                >
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                    <img src={getNetworkLogo(tx.network)} alt="network" style={{ width: "24px", height: "24px", marginRight: "0.5rem" }} />
                    <strong>{tx.network.toUpperCase()}</strong>
                  </div>
                  <p><strong>Type:</strong> {tx.type}</p>
                  <p><strong>Amount:</strong> {tx.amount}</p>
                  <p><strong>Sender:</strong> {tx.sender_address?.slice(0, 6)}...{tx.sender_address?.slice(-4)}</p>
                  <p><strong>Receiver:</strong> {tx.receiver_address?.slice(0, 6)}...{tx.receiver_address?.slice(-4)}</p>
                  <p><strong>Status:</strong> {renderStatusBadge(tx.status)}</p>
                  <p><strong>Date:</strong> {new Date(tx.created_at).toLocaleString()}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
