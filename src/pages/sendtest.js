"use client";

import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalances } from "@/contexts/BalanceContext";
import { useSend } from "@/contexts/SendContext";
import { useSystemReady } from "@/hooks/useSystemReady";

import { getGasPrice } from "@/utils/getGasPrice"; // Pakeista čia
import styles from "@/styles/sendtest.module.css";

// Tinklas + ikonos
const NETWORK_OPTIONS = [
  { label: "BNB", value: "bnb", icon: "/icons/bnb.svg" },
  { label: "TBNB", value: "tbnb", icon: "/icons/bnb.svg" },
  { label: "ETH", value: "eth", icon: "/icons/eth.svg" },
  { label: "Polygon", value: "matic", icon: "/icons/matic.svg" },
  { label: "Avalanche", value: "avax", icon: "/icons/avax.svg" },
];

export default function SendTest() {
  const { ready, loading } = useSystemReady();
  const { wallet } = useAuth();
  const { selectedNetwork, setSelectedNetwork } = useNetwork();
  const { balances } = useBalances();
  const { sendTransaction } = useSend();

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [gasPrice, setGasPrice] = useState(null);
  const [estimatedGas, setEstimatedGas] = useState(21000);
  const [fees, setFees] = useState("0.000");
  const [processing, setProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorData, setErrorData] = useState(null);

  const amountInputRef = useRef();

  // 1. Užkraunam gas price
  useEffect(() => {
    if (!selectedNetwork) return;
    getGasPrice(selectedNetwork)
      .then((price) => setGasPrice(price))
      .catch(() => setGasPrice(null));
  }, [selectedNetwork]);

  // 2. Skaičiuojam fees
  useEffect(() => {
    if (!amount || !gasPrice) return;

    const parsedAmount = parseFloat(amount);
    const gasTotal = (gasPrice * estimatedGas * 2) / 1e18; // *2 už admin + recipient
    const adminFee = parsedAmount * 0.03;
    const totalFee = gasTotal + adminFee;

    setFees(totalFee.toFixed(6));
  }, [amount, gasPrice, estimatedGas]);

  if (loading || !ready || !wallet?.wallet?.address) return null;

  const handleSend = async () => {
    if (!ethers.isAddress(to)) {
      alert("Invalid address");
      return;
    }

    if (parseFloat(amount) <= 0) {
      alert("Enter valid amount");
      return;
    }

    setConfirmOpen(true);
  };

  const confirmSend = async () => {
    setProcessing(true);
    setConfirmOpen(false);

    try {
      const tx = await sendTransaction({ to, amount, network: selectedNetwork });
      setSuccessData(tx);
      setTo("");
      setAmount("");
    } catch (err) {
      setErrorData(err.message || "Unknown error");
    } finally {
      setProcessing(false);
    }
  };

  const currentBalance = parseFloat(balances[selectedNetwork]?.balance || 0);
  const networkInfo = NETWORK_OPTIONS.find((n) => n.value === selectedNetwork);
  const networkLabel = networkInfo?.label || selectedNetwork.toUpperCase();
  const networkIcon = networkInfo?.icon;

  const getExplorerLink = (net, hash) => {
    switch (net) {
      case "bnb":
        return `https://bscscan.com/tx/${hash}`;
      case "tbnb":
        return `https://testnet.bscscan.com/tx/${hash}`;
      case "eth":
        return `https://etherscan.io/tx/${hash}`;
      case "matic":
        return `https://polygonscan.com/tx/${hash}`;
      case "avax":
        return `https://snowtrace.io/tx/${hash}`;
      default:
        return "#";
    }
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Send Crypto</h1>

      {/* Network Selector */}
      <div className={styles.networkDropdown}>
        {NETWORK_OPTIONS.map((net) => (
          <button
            key={net.value}
            className={`${styles.networkOption} ${selectedNetwork === net.value ? styles.active : ""}`}
            onClick={() => {
              setSelectedNetwork(net.value);
              setTimeout(() => amountInputRef.current?.focus(), 200);
            }}
          >
            <Image src={net.icon} alt={net.label} width={20} height={20} />
            <span>{net.label}</span>
          </button>
        ))}
      </div>

      {/* Form */}
      <div className={styles.sendForm}>
        <input
          type="text"
          placeholder="Recipient address"
          className={styles.input}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <input
          ref={amountInputRef}
          type="number"
          placeholder="Amount"
          className={styles.input}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <p className={styles.balance}>
          Balance: {currentBalance.toFixed(6)} {networkLabel}
        </p>

        <div className={styles.feeBox}>
          <span>Estimated Fees:</span>
          <span>{fees} {networkLabel}</span>
        </div>

        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={processing || !to || !amount || !ethers.isAddress(to)}
        >
          {processing ? "Processing..." : "Send"}
        </button>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className={styles.modal}>
              <h2>Confirm Transaction</h2>
              <p><strong>To:</strong> {to}</p>
              <p><strong>Amount:</strong> {amount} {networkLabel}</p>
              <p><strong>Fees:</strong> {fees} {networkLabel}</p>
              <div className={styles.modalActions}>
                <button onClick={confirmSend} className={styles.confirmBtn}>Confirm</button>
                <button onClick={() => setConfirmOpen(false)} className={styles.cancelBtn}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {successData && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className={styles.modal}>
              <h2>Transaction Successful</h2>
              <p>TxHash:</p>
              <a
                href={getExplorerLink(selectedNetwork, successData.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.txLink}
              >
                {successData.hash.slice(0, 10)}...{successData.hash.slice(-6)}
              </a>
              <button onClick={() => setSuccessData(null)} className={styles.confirmBtn}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {errorData && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className={styles.modal}>
              <h2>Error</h2>
              <p>{errorData}</p>
              <button onClick={() => setErrorData(null)} className={styles.cancelBtn}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
