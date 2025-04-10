"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { fetchNetworkTransactions } from "@/utils/networkApi";
import { useAuth } from "@/contexts/AuthContext";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/history.module.css";
import background from "@/styles/background.module.css";

const NETWORK_OPTIONS = [
  { label: "BNB Mainnet", value: "bnb" },
  { label: "BNB Testnet", value: "tbnb" },
  { label: "Ethereum Mainnet", value: "eth" },
  { label: "Polygon Mainnet", value: "polygon" },
  { label: "Avalanche Mainnet", value: "avax" },
];

export default function HistoryPage() {
  const { wallet, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [network, setNetwork] = useState("bnb");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  // ✅ Šitas useEffect leidžia scrollint tik žemyn ir draudžia horizontaliai
  useEffect(() => {
    document.body.style.overflowX = "hidden"; // Draudžiam į šoną
    document.body.style.overflowY = "auto";   // Leidžiam tik žemyn

    return () => {
      document.body.style.overflow = ""; // Gražinam normalų scrollą kai išeinam iš puslapio
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && !wallet?.wallet?.address) {
      router.replace("/");
    }
  }, [isClient, authLoading, wallet, router]);

  const fetchTransactions = async () => {
    if (!wallet?.wallet?.address) return;
    try {
      setLoading(true);
      const txs = await fetchNetworkTransactions(network, wallet.wallet.address);
      setTransactions(txs);
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wallet?.wallet?.address) {
      fetchTransactions();
      const interval = setInterval(fetchTransactions, 60 * 1000); // Auto-refresh kas 1 min
      return () => clearInterval(interval);
    }
  }, [wallet, network]);

  const getExplorerLink = (net, txHash) => {
    switch (net) {
      case "bnb": return `https://bscscan.com/tx/${txHash}`;
      case "tbnb": return `https://testnet.bscscan.com/tx/${txHash}`;
      case "eth": return `https://etherscan.io/tx/${txHash}`;
      case "polygon": return `https://polygonscan.com/tx/${txHash}`;
      case "avax": return `https://snowtrace.io/tx/${txHash}`;
      default: return "#";
    }
  };

  const renderStatusBadge = (tx) => {
    if (tx.isError === "0" || tx.txreceipt_status === "1") {
      return <span style={{ color: "limegreen", fontWeight: "bold" }}>✔️ Success</span>;
    }
    if (tx.txreceipt_status === "0") {
      return <span style={{ color: "red", fontWeight: "bold" }}>❌ Failed</span>;
    }
    return <span style={{ color: "orange", fontWeight: "bold" }}>⏳ Pending</span>;
  };

  if (!isClient || authLoading) {
    return <div className={styles.loading}><MiniLoadingSpinner /> Loading wallet...</div>;
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>TRANSACTION HISTORY</h1>
        <p className={styles.subtext}>Real-Time Blockchain History</p>

        {/* Network Dropdown */}
        <div style={{ position: "relative", marginBottom: "2rem" }}>
          <select
            value={network}
            onChange={(e) => {
              setNetwork(e.target.value);
              setVisibleCount(5);
            }}
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.8rem 1.2rem",
              borderRadius: "12px",
              border: "1px solid #333",
              backgroundColor: "#0a0a0a",
              color: "#fff",
              fontSize: "1rem",
              appearance: "none",
              position: "relative",
              zIndex: 2,
            }}
          >
            {NETWORK_OPTIONS.map((net) => (
              <option key={net.value} value={net.value}>{net.label}</option>
            ))}
          </select>

          {loading && (
            <div style={{
              position: "absolute",
              top: "50%",
              right: "12px",
              transform: "translateY(-50%)",
              zIndex: 3,
            }}>
              <MiniLoadingSpinner size={24} />
            </div>
          )}
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className={styles.loading}><MiniLoadingSpinner /> Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className={styles.loading}>No transactions found.</div>
        ) : (
          <div className={styles.transactionList}>
            <AnimatePresence>
              {transactions.slice(0, visibleCount).map((tx, index) => (
                <motion.div
                  key={tx.hash || index}
                  className={styles.transactionCard}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)" }}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.65)",
                    borderRadius: "18px",
                    padding: "1.5rem",
                    marginBottom: "1.2rem",
                    backdropFilter: "blur(14px)",
                  }}
                >
                  <p><strong>From:</strong> {tx.from.slice(0, 6)}...{tx.from.slice(-4)}</p>
                  <p><strong>To:</strong> {tx.to.slice(0, 6)}...{tx.to.slice(-4)}</p>
                  <p><strong>Value:</strong> {parseFloat(tx.value) / 1e18} {network.toUpperCase()}</p>
                  <p><strong>Status:</strong> {renderStatusBadge(tx)}</p>
                  <p><strong>Tx Hash:</strong> <a href={getExplorerLink(network, tx.hash)} target="_blank" rel="noopener noreferrer" style={{ color: "#00FF00" }}>{tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}</a></p>
                  <p><strong>Time:</strong> {new Date(tx.timeStamp * 1000).toLocaleString()}</p>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* View More Button */}
            {visibleCount < transactions.length && (
              <button
                onClick={() => setVisibleCount(visibleCount + 5)}
                style={{
                  marginTop: "1.5rem",
                  padding: "0.8rem 1.5rem",
                  backgroundColor: "#0a0a0a",
                  color: "#00FF00",
                  border: "1px solid #00FF00",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                Load More
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
