// src/app/history.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import { useMinimalReady } from "@/hooks/useMinimalReady";
import { fetchNetworkTransactions } from "@/utils/networkApi";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/history.module.css";
import background from "@/styles/background.module.css";

const NETWORK_OPTIONS = [
  { label: "BNB Mainnet", value: "bnb", icon: "/icons/bnb.svg" },
  { label: "BNB Testnet", value: "tbnb", icon: "/icons/bnb.svg" },
  { label: "Ethereum Mainnet", value: "eth", icon: "/icons/eth.svg" },
  { label: "Polygon Mainnet", value: "polygon", icon: "/icons/matic.svg" },
  { label: "Avalanche Mainnet", value: "avax", icon: "/icons/avax.svg" },
];

export default function HistoryPage() {
  const router = useRouter();
  const { wallet } = useAuth();
  const { ready, loading } = useMinimalReady();

  const [network, setNetwork] = useState("bnb");
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedNetwork = NETWORK_OPTIONS.find((net) => net.value === network);

  const fetchTransactions = async () => {
    if (!wallet?.wallet?.address) return;
    try {
      setTxLoading(true);
      const txs = await fetchNetworkTransactions(network, wallet.wallet.address);
      setTransactions(txs);
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    if (ready && wallet?.wallet?.address) {
      fetchTransactions();
      const interval = setInterval(fetchTransactions, 60000);
      return () => clearInterval(interval);
    }
  }, [ready, wallet, network]);

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
      return <span className={styles.statusSuccess}>✔️ Success</span>;
    }
    if (tx.txreceipt_status === "0") {
      return <span className={styles.statusFailed}>❌ Failed</span>;
    }
    return <span className={styles.statusPending}>⏳ Pending</span>;
  };

  if (loading || !ready) {
    return (
      <div className={styles.loading}>
        <MiniLoadingSpinner /> Loading session...
      </div>
    );
  }

  if (!wallet?.wallet?.address) {
    router.replace("/");
    return (
      <div className={styles.loading}>
        <MiniLoadingSpinner /> Redirecting...
      </div>
    );
  }

  return (
    <main
      className={`${styles.container} ${background.gradient}`}
      style={{ width: "100vw", height: "100vh", overflowY: "auto" }}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>Transaction History</h1>
        <div className={styles.networkSelector}>
          <button
            className={styles.dropdownButton}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Image src={selectedNetwork.icon} alt="" width={20} height={20} />
            <span>{selectedNetwork.label}</span>
          </button>
          {dropdownOpen && (
            <div className={styles.dropdownList}>
              {NETWORK_OPTIONS.map((net) => (
                <div
                  key={net.value}
                  className={styles.dropdownItem}
                  onClick={() => {
                    setNetwork(net.value);
                    setDropdownOpen(false);
                  }}
                >
                  <Image src={net.icon} alt="" width={20} height={20} />
                  {net.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.txList}>
        {txLoading ? (
          <div className={styles.loadingBox}>
            <MiniLoadingSpinner /> Loading transactions...
          </div>
        ) : (
          <AnimatePresence>
            {transactions.slice(0, visibleCount).map((tx) => (
              <motion.div
                key={tx.hash}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={styles.txItem}
              >
                <div className={styles.txHeader}>
                  <div className={styles.txIconHash}>
                    <Image
                      src="/icons/tx-icon.svg"
                      alt="tx"
                      width={20}
                      height={20}
                    />
                    <a
                      href={getExplorerLink(network, tx.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.txHash}
                    >
                      {tx.hash.substring(0, 10)}...{tx.hash.slice(-6)}
                    </a>
                  </div>
                  <div className={styles.txStatus}>
                    {renderStatusBadge(tx)}
                  </div>
                </div>
                <div className={styles.txDetails}>
                  <p><strong>From:</strong> {tx.from}</p>
                  <p><strong>To:</strong> {tx.to}</p>
                  <p>
                    <strong>Value:</strong>{" "}
                    {(parseFloat(tx.value) / 1e18).toFixed(6)}{" "}
                    {network.toUpperCase()}
                  </p>
                  <p>
                    <strong>Time:</strong>{" "}
                    {new Date(tx.timeStamp * 1000).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {transactions.length > visibleCount && (
        <button
          className={styles.loadMoreBtn}
          onClick={() => setVisibleCount(visibleCount + 5)}
        >
          Load More
        </button>
      )}
    </main>
  );
}
