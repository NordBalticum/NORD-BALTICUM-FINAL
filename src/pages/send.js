"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

import SwipeSelector from "@/components/SwipeSelector";
import SuccessModal from "@/components/modals/SuccessModal";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

const networkShortNames = {
  eth: "ETH",
  bnb: "BNB",
  tbnb: "tBNB",
  matic: "MATIC",
  avax: "AVAX",
};

const buttonColors = {
  eth: "#0072ff",
  bnb: "#f0b90b",
  tbnb: "#f0b90b",
  matic: "#8247e5",
  avax: "#e84142",
};

export default function SendPage() {
  const router = useRouter();
  const { user, wallet, balances, sendTransaction, refreshBalance, loading } = useAuth();

  const [isClient, setIsClient] = useState(false);
  const [localNetwork, setLocalNetwork] = useState("eth");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (isClient && !loading && !user) {
      router.replace("/");
    }
  }, [isClient, loading, user, router]);

  const shortName = useMemo(() => networkShortNames[localNetwork.toLowerCase()] || localNetwork.toUpperCase(), [localNetwork]);

  const netBalance = balances?.[localNetwork] || 0;
  const parsedAmount = Number(amount || 0);
  const fee = parsedAmount * 0.03;
  const amountAfterFee = parsedAmount - fee;
  const maxSendable = netBalance - netBalance * 0.03;

  const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const handleNetworkChange = useCallback((network) => {
    if (network) {
      setLocalNetwork(network);
      setToastMessage(`✅ Switched to ${networkShortNames[network] || network.toUpperCase()}`);
      setTimeout(() => setToastMessage(""), 2000);
    }
  }, []);

  const handleSend = () => {
    if (!isValidAddress(receiver)) {
      alert("❌ Invalid wallet address.");
      return;
    }
    if (parsedAmount <= 0) {
      alert("❌ Enter a valid amount.");
      return;
    }
    if (parsedAmount > maxSendable) {
      alert(`❌ Insufficient balance. Max sendable: ${maxSendable.toFixed(6)} ${shortName}`);
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    setSending(true);

    try {
      const result = await sendTransaction({
        receiver: receiver.trim(),
        amount: parsedAmount,
        network: localNetwork,
      });

      if (result?.success) {
        setReceiver("");
        setAmount("");
        setTxHash(result.txHash);
        await refreshBalance(localNetwork);
        setShowSuccess(true);
      } else {
        alert(result?.message || "❌ Transaction failed.");
      }
    } catch (err) {
      console.error("Send error:", err);
      alert("❌ Unexpected error while sending.");
    } finally {
      setSending(false);
    }
  };

  const fullyReady = isClient && !loading && user && wallet && wallet.wallet?.address;

if (!fullyReady) {
  return <div className={styles.loading}>Loading...</div>;
}

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`${styles.main} ${background.gradient}`}
    >
      <div className={styles.wrapper}>
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className={styles.successAlert}
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Transfer crypto securely & instantly</p>

        <SwipeSelector mode="send" onSelect={handleNetworkChange} />

        <div className={styles.balanceTable}>
          <p className={styles.whiteText}>
            Your Balance:&nbsp;
            <span className={styles.balanceAmount}>
              {netBalance.toFixed(6)} {shortName}
            </span>
          </p>
          <p className={styles.whiteText}>
            Max Sendable:&nbsp;
            <span className={styles.balanceAmount}>
              {maxSendable.toFixed(6)} {shortName}
            </span>
          </p>
        </div>

        <div className={styles.walletActions}>
          <input
            type="text"
            placeholder="Receiver address"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className={styles.inputField}
          />
          <input
            type="number"
            placeholder="Amount to send"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
          />

          <p className={styles.feeBreakdown}>
            After 3% Fee: <strong>{amountAfterFee > 0 ? amountAfterFee.toFixed(6) : 0} {shortName}</strong>
          </p>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSend}
            style={{
              backgroundColor: buttonColors[localNetwork?.toLowerCase()] || "#0070f3",
              color: "white",
              borderRadius: "14px",
              padding: "14px",
              fontWeight: "700",
              fontFamily: "var(--font-crypto)",
              border: "2px solid white",
              cursor: sending ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              width: "100%",
              marginTop: "14px",
            }}
            disabled={sending}
          >
            {sending ? "Sending..." : "SEND NOW"}
          </motion.button>
        </div>

        {/* Confirm Modal */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className={styles.confirmModal}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.modalTitle}>Final Confirmation</div>
                <div className={styles.modalInfo}>
                  <p><strong>Network:</strong> {shortName}</p>
                  <p><strong>Receiver:</strong> {receiver}</p>
                  <p><strong>Send:</strong> {parsedAmount.toFixed(6)} {shortName}</p>
                  <p><strong>Receive:</strong> {amountAfterFee.toFixed(6)} {shortName}</p>
                </div>
                <div className={styles.modalActions}>
                  <button className={styles.modalButton} onClick={confirmSend}>Confirm</button>
                  <button className={`${styles.modalButton} ${styles.cancel}`} onClick={() => setShowConfirm(false)}>
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SuccessModal
                message="✅ Transaction completed successfully!"
                txHash={txHash}
                networkKey={localNetwork}
                onClose={() => setShowSuccess(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
