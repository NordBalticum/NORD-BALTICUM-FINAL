"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { fetchNetworkTransactions } from "@/utils/networkApi";
import { useAuth } from "@/contexts/AuthContext";
import { useMinimalReady } from "@/hooks/useMinimalReady";
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

  const selectedNetwork = NETWORK_OPTIONS.find(net => net.value === network);

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
      style={{ width: "100vw", height: "100vh", overflowY: "auto" }}
      className={`${styles.container} ${background.gradient}`}
    >
      {/* ... tavo dropdown, transaction list ir kt. */}
    </main>
  );
}
