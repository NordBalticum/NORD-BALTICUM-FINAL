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

import styles from "@/styles/sendtest.module.css";

const NETWORK_OPTIONS = [
  { label: "BNB", value: "bnb", icon: "/icons/bnb.svg" },
  { label: "TBNB", value: "tbnb", icon: "/icons/bnb.svg" },
  { label: "ETH", value: "eth", icon: "/icons/eth.svg" },
  { label: "Polygon", value: "matic", icon: "/icons/matic.svg" },
  { label: "Avalanche", value: "avax", icon: "/icons/avax.svg" },
];

export default function SendTest() {
  const { ready, loading } = useSystemReady();
  const { wallet, user } = useAuth();
  const { selectedNetwork, setSelectedNetwork } = useNetwork();
  const { balances } = useBalances();
  const {
    gasFee,
    adminFee,
    totalFee,
    feeLoading,
    calculateFees,
    sendTransaction,
  } = useSend();

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorData, setErrorData] = useState(null);

  const amountRef = useRef();

  useEffect(() => {
    if (selectedNetwork && amount) {
      calculateFees(selectedNetwork, amount);
    }
  }, [selectedNetwork, amount]);

  if (loading || !ready || !wallet?.wallet?.address) return null;

  const handleSend = () => {
    if (!ethers.isAddress(to)) return alert("Invalid address.");
    if (parseFloat(amount) <= 0) return alert("Enter valid amount.");
    setConfirmOpen(true);
  };

  const confirmSend = async () => {
    setConfirmOpen(false);
    setProcessing(true);
    try {
      const txHash = await sendTransaction({
        to,
        amount,
        network: selectedNetwork,
        userEmail: user?.email,
      });
      setSuccessData(txHash);
      setTo("");
      setAmount("");
    } catch (err) {
      setErrorData(err.message || "Unknown error.");
    } finally {
      setProcessing(false);
    }
  };

  const currentBalance = parseFloat(balances[selectedNetwork]?.balance || 0);
  const networkInfo = NETWORK_OPTIONS.find(n => n.value === selectedNetwork);
  const networkLabel = networkInfo?.label || selectedNetwork.toUpperCase();
  const networkIcon = networkInfo?.icon;

  const explorerLink = (hash) => {
    const explorers = {
      bnb: "https://bscscan.com/tx/",
      tbnb: "https://testnet.bscscan.com/tx/",
      eth: "https://etherscan.io/tx/",
      matic: "https://polygonscan.com/tx/",
      avax: "https://snowtrace.io/tx/",
    };
    return `${explorers[selectedNetwork] || "#"}${hash}`;
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Send Crypto</h1>

      <div className={styles.networkDropdown}>
        {NETWORK_OPTIONS.map((net) => (
          <button
            key={net.value}
            className={`${styles.networkOption} ${selectedNetwork === net.value ? styles.active : ""}`}
            onClick={() => {
              setSelectedNetwork(net.value);
              setTimeout(() => amountRef.current?.focus(), 300);
            }}
          >
            <Image src={net.icon} alt={net.label} width={20} height={20} />
            <span>{net.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.sendForm}>
        <input
          type="text"
          placeholder="Recipient address"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className={styles.input}
        />
        <input
          ref={amountRef}
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={styles.input}
        />

        <p className={styles.balance}>
          Balance: {currentBalance.toFixed(6)} {networkLabel}
        </p>

        <div className={styles.feeBox}>
          {feeLoading ? (
            <span>Calculating fees...</span>
          ) : (
            <>
              <span>Fees:</span>
              <span>{totalFee.toFixed(6)} {networkLabel}</span>
            </>
          )}
        </div>

        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={processing || !to || !amount}
        >
          {processing ? "Processing..." : "Send"}
        </button>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={styles.modal}>
              <h2>Confirm Transaction</h2>
              <p><strong>To:</strong> {to}</p>
              <p><strong>Amount:</strong> {amount} {networkLabel}</p>
              <p><strong>Gas Fee:</strong> {gasFee.toFixed(6)} {networkLabel}</p>
              <p><strong>Admin Fee:</strong> {adminFee.toFixed(6)} {networkLabel}</p>
              <p><strong>Total:</strong> {totalFee.toFixed(6)} {networkLabel}</p>
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
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={styles.modal}>
              <h2>Transaction Successful</h2>
              <p>TxHash:</p>
              <a href={explorerLink(successData)} target="_blank" rel="noopener noreferrer" className={styles.txLink}>
                {successData.slice(0, 10)}...{successData.slice(-6)}
              </a>
              <button onClick={() => setSuccessData(null)} className={styles.confirmBtn}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {errorData && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
