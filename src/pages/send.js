"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { useSendCrypto } from "@/hooks/useSendCrypto";
import { usePageReady } from "@/hooks/usePageReady";
import { useFeeCalculator } from "@/hooks/useFeeCalculator"; // ✅ Naujas hook'as!

import SwipeSelector from "@/components/SwipeSelector";
import LoadingSpinner from "@/components/LoadingSpinner";
import SuccessModal from "@/components/modals/SuccessModal";
import SuccessToast from "@/components/SuccessToast";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

// ✅ Network trumpiniai
const networkShortNames = {
  ethereum: "ETH",
  bsc: "BNB",
  tbnb: "tBNB",
  polygon: "MATIC",
  avalanche: "AVAX",
};

// ✅ Mygtukų spalvos
const buttonColors = {
  ethereum: "#0072ff",
  bsc: "#f0b90b",
  tbnb: "#f0b90b",
  polygon: "#8247e5",
  avalanche: "#e84142",
};

export default function SendPage() {
  const router = useRouter();
  const isReady = usePageReady();
  const { wallet } = useAuth();
  const { balances, loading: balancesLoading } = useBalance();
  const { sendCrypto, loading: sending, success, txHash, error } = useSendCrypto();

  const [localNetwork, setLocalNetwork] = useState("bsc");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const shortName = useMemo(() => networkShortNames[localNetwork] || localNetwork.toUpperCase(), [localNetwork]);
  const netBalance = balances?.[localNetwork]?.balance ? parseFloat(balances[localNetwork].balance) : 0;
  const parsedAmount = Number(amount) || 0;

  const { gasFee, adminFee, totalFee, loading: feesLoading } = useFeeCalculator(localNetwork, parsedAmount);

  const maxSendable = netBalance - totalFee; // ✅ Tiksliai pagal gas + 3%
  const amountAfterFee = parsedAmount - adminFee; // ✅ Tik žmogaus gauta suma

  const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const handleNetworkChange = useCallback((network) => {
    if (network) {
      setLocalNetwork(network);
      setToastMessage(`Switched to ${networkShortNames[network] || network.toUpperCase()}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
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
    if (parsedAmount + totalFee > netBalance) {
      alert(`❌ Insufficient balance. You need at least ${(parsedAmount + totalFee).toFixed(6)} ${shortName}.`);
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    try {
      await sendCrypto({
        to: receiver.trim(),
        amount: parsedAmount,
        network: localNetwork,
      });
      setReceiver("");
      setAmount("");
      setShowSuccess(true);
    } catch (err) {
      console.error("❌ Send error:", err.message);
      alert("❌ Unexpected error during send.");
    }
  };

  useEffect(() => {
    if (success) {
      setShowSuccess(true);
    }
  }, [success]);

  if (!isReady || balancesLoading || feesLoading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`${styles.main} ${background.gradient}`}
    >
      <div className={styles.wrapper}>
        <SuccessToast show={showToast} message={toastMessage} networkKey={localNetwork} />

        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Transfer crypto securely & instantly</p>

        <SwipeSelector onSelect={handleNetworkChange} />

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
              {maxSendable > 0 ? maxSendable.toFixed(6) : "0.000000"} {shortName}
            </span>
          </p>
        </div>

        {/* ✅ FEES */}
        <div className={styles.feeDetails}>
          <p>Network Fee (Gas): <strong>{gasFee.toFixed(6)} {shortName}</strong></p>
          <p>Admin Fee (3%): <strong>{adminFee.toFixed(6)} {shortName}</strong></p>
          <p>Total Fee: <strong>{totalFee.toFixed(6)} {shortName}</strong></p>
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
            After 3% Fee:&nbsp;
            <strong>{amountAfterFee > 0 ? amountAfterFee.toFixed(6) : 0} {shortName}</strong>
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
              width: "100%",
              marginTop: "14px",
            }}
            disabled={sending}
          >
            {sending ? <LoadingSpinner /> : "SEND NOW"}
          </motion.button>
        </div>

        {/* ✅ Confirm Modal */}
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

        {/* ✅ Success Modal */}
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

        {/* ✅ Error */}
        <AnimatePresence>
          {error && (
            <div style={{ color: "red", marginTop: "20px", textAlign: "center" }}>
              ❌ {error}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
              }
