"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useMemo } from "react";
import { ethers } from "ethers";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext"; // ✅ FIXED
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
  const { balances } = typeof window !== "undefined" ? useBalance() : {};

  const {
    sendTransaction,
    sending,
    gasFee,
    adminFee,
    totalFee,
    feeLoading,
    feeError,
    calculateFees,
  } = typeof window !== "undefined" ? useSend() : {};

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorData, setErrorData] = useState(null);

  const amountRef = useRef();
  const parsedAmount = useMemo(() => parseFloat(amount) || 0, [amount]);

  const balance = useMemo(
    () => parseFloat(balances?.[selectedNetwork]?.balance || "0"),
    [balances, selectedNetwork]
  );

  const totalRequired = parsedAmount + (totalFee || 0);
  const isAddressValid = useMemo(() => ethers.isAddress(to.trim()), [to]);

  const networkLabel = useMemo(() => {
    return (
      NETWORK_OPTIONS.find((n) => n.value === selectedNetwork)?.label ||
      selectedNetwork.toUpperCase()
    );
  }, [selectedNetwork]);

  useEffect(() => {
    if (selectedNetwork && parsedAmount) {
      calculateFees?.(selectedNetwork, parsedAmount);
    }
  }, [selectedNetwork, parsedAmount]);

  useEffect(() => {
    console.log("📦 Wallet:", wallet);
    console.log("📧 User:", user);
    console.log("🌐 Network:", selectedNetwork);
    console.log("💰 Balance:", balances?.[selectedNetwork]?.balance);
    console.log("🧮 Amount:", amount);
  }, [wallet, user, selectedNetwork, balances, amount]);

  if (loading || !ready || !wallet?.wallet?.address) return null;

  const handleSend = () => {
    console.log("➡️ handleSend triggered");

    if (!isAddressValid) return toast.error("❌ Invalid wallet address.");
    if (!parsedAmount || parsedAmount <= 0) return toast.error("❌ Enter valid amount.");
    if (totalRequired > balance)
      return toast.error(`❌ Insufficient balance. Required: ${totalRequired.toFixed(6)} ${networkLabel}`);

    if ("vibrate" in navigator) navigator.vibrate(40);
    setConfirmOpen(true);
  };

  const confirmSend = async () => {
    setConfirmOpen(false);
    try {
      console.log("⏳ Sending TX", { to, parsedAmount, selectedNetwork });

      if ("vibrate" in navigator) navigator.vibrate(80);

      const txHash = await sendTransaction({
        to: to.trim(),
        amount: parsedAmount,
        network: selectedNetwork,
        userEmail: user?.email,
      });

      setSuccessData(txHash);
      setTo("");
      setAmount("");
      toast.success("✅ Transaction successful!");
    } catch (err) {
      const msg = err?.message || "Unknown error.";
      toast.error("❌ Transaction failed: " + msg);
      setErrorData(msg);
    }
  };

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
            className={`${styles.networkOption} ${
              selectedNetwork === net.value ? styles.active : ""
            }`}
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
          min="0"
        />

        <p className={styles.balance}>
          Balance: {balance.toFixed(6)} {networkLabel}
        </p>

        <div className={styles.feeBox}>
          {feeLoading ? (
            <span>Calculating fees...</span>
          ) : feeError ? (
            <span style={{ color: "red" }}>Fee error</span>
          ) : (
            <>
              <span>Fees:</span>
              <span>{totalFee?.toFixed(6)} {networkLabel}</span>
            </>
          )}
        </div>

        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={sending || !to || !amount}
        >
          {sending ? "Processing..." : "Send"}
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
              <p><strong>Amount:</strong> {parsedAmount.toFixed(6)} {networkLabel}</p>
              <p><strong>Gas Fee:</strong> {gasFee?.toFixed(6)} {networkLabel}</p>
              <p><strong>Admin Fee:</strong> {adminFee?.toFixed(6)} {networkLabel}</p>
              <p><strong>Total:</strong> {totalFee?.toFixed(6)} {networkLabel}</p>
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
                href={explorerLink(successData)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.txLink}
              >
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

      <ToastContainer />
    </main>
  );
}
