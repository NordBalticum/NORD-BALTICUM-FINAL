"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/history.module.css";
import background from "@/styles/background.module.css";

export default function HistoryPage() {
  const router = useRouter();
  const { user, wallet, loading: authLoading } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);

  const [filterNetwork, setFilterNetwork] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const RPC_URLS = {
    bnb: "https://bsc-dataseed.bnbchain.org",
    tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545",
    eth: "https://rpc.ankr.com/eth",
    polygon: "https://polygon-rpc.com",
    avax: "https://api.avax.network/ext/bc/C/rpc",
  };

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
    fetchUserTransactions();

    const subscription = supabase
      .channel('realtime:transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchUserTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchUserTransactions]);

  const scanBlockchain = async () => {
    if (!wallet?.wallet?.address) return;
    try {
      setScanning(true);

      for (const [networkKey, rpcUrl] of Object.entries(RPC_URLS)) {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const history = await provider.getHistory(wallet.wallet.address);

        if (history.length > 0) {
          for (const tx of history.reverse()) {
            const { data: existingTx } = await supabase
              .from("transactions")
              .select("tx_hash")
              .eq("tx_hash", tx.hash)
              .single();

            if (!existingTx) {
              await supabase.from("transactions").insert([
                {
                  sender_address: tx.from,
                  receiver_address: tx.to,
                  amount: Number(ethers.formatEther(tx.value)),
                  network: networkKey,
                  type: "receive",
                  tx_hash: tx.hash,
                  status: tx.confirmations > 0 ? "completed" : "pending",
                  user_email: user.email,
                },
              ]);
            }
          }
        }
      }

      await fetchUserTransactions();
    } catch (error) {
      console.error("❌ Scan blockchain error:", error.message || error);
    } finally {
      setScanning(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const networkMatch = filterNetwork === "All" || tx.network === filterNetwork;
    const statusMatch = filterStatus === "All" || tx.status === filterStatus;
    return networkMatch && statusMatch;
  });

  const renderStatusBadge = (status) => {
    if (status === "completed") {
      return <span style={{ color: "limegreen", fontWeight: "bold" }}>✔️ Completed</span>;
    }
    if (status === "pending") {
      return <span style={{ color: "orange", fontWeight: "bold" }}>⏳ Pending</span>;
    }
    return <span style={{ color: "red", fontWeight: "bold" }}>❌ Failed</span>;
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

  const getExplorerLink = (network, txHash) => {
    switch (network) {
      case "bnb": return `https://bscscan.com/tx/${txHash}`;
      case "tbnb": return `https://testnet.bscscan.com/tx/${txHash}`;
      case "eth": return `https://etherscan.io/tx/${txHash}`;
      case "polygon": return `https://polygonscan.com/tx/${txHash}`;
      case "avax": return `https://snowtrace.io/tx/${txHash}`;
      default: return "#";
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
        <p className={styles.subtext}>View and manage your crypto activity</p>

        {/* Filter controls */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "2rem" }}>
          <button
            onClick={scanBlockchain}
            disabled={scanning}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "10px",
              border: "1px solid #0070f3",
              backgroundColor: scanning ? "#222" : "#0070f3",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {scanning ? "Scanning..." : "Scan Blockchain"}
          </button>

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
            <option value="eth">Ethereum Mainnet</option>
            <option value="polygon">Polygon Mainnet</option>
            <option value="avax">Avalanche Mainnet</option>
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

        {/* Transaction list */}
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
                  className={styles.transactionCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(0, 255, 255, 0.3)" }}
                  style={{
                    backgroundColor: tx.status === "completed" ? "rgba(0,255,0,0.08)" : "rgba(255,0,0,0.08)",
                    borderRadius: "20px",
                    padding: "1.5rem",
                    marginBottom: "1.2rem",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                    <img src={getNetworkLogo(tx.network)} alt="network" style={{ width: "24px", height: "24px", marginRight: "0.5rem" }} />
                    <strong>{tx.network.toUpperCase()}</strong>
                  </div>
                  <p><strong>Type:</strong> {tx.type}</p>
                  <p><strong>Amount:</strong> {tx.amount}</p>
                  <p><strong>Sender:</strong> {tx.sender_address.slice(0, 6)}...{tx.sender_address.slice(-4)}</p>
                  <p><strong>Receiver:</strong> {tx.receiver_address.slice(0, 6)}...{tx.receiver_address.slice(-4)}</p>
                  <p><strong>Status:</strong> {renderStatusBadge(tx.status)}</p>
                  <p><strong>Tx Hash:</strong> <a href={getExplorerLink(tx.network, tx.tx_hash)} target="_blank" rel="noopener noreferrer" style={{ color: "#00FF00" }}>{tx.tx_hash.slice(0, 8)}...{tx.tx_hash.slice(-6)}</a></p>
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
