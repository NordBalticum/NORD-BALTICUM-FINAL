"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import { useBalances } from "@/contexts/BalanceContext";
import { useSendCrypto } from "@/contexts/SendCryptoContext";

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
  const { user, loading: authLoading } = useAuth();
  const { balance, balanceEUR, maxSendable, refreshBalance, activeNetwork, setActiveNetwork, loading: balanceLoading } = useBalances();
  const { sendTransaction } = useSendCrypto();

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [balanceUpdated, setBalanceUpdated] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && !user) {
      router.replace("/");
    }
  }, [isClient, authLoading, user, router]);

  useEffect(() => {
    if (isClient && !activeNetwork) {
      setActiveNetwork("eth");
    }
  }, [isClient, activeNetwork, setActiveNetwork]);

  const isLoading = authLoading || balanceLoading || !isClient;

  if (isLoading) return <div className={styles.loading}>Loading...</div>;
  if (!user) return null;

  const parsedAmount = Number(amount || 0);
  const fee = parsedAmount * 0.03;
  const amountAfterFee = parsedAmount - fee;

  const shortName = useMemo(() => {
    if (!activeNetwork) return "";
    return networkShortNames[activeNetwork.toLowerCase()] || "";
  }, [activeNetwork]);

  const netBalance = activeNetwork ? balance(activeNetwork) : 0;
  const netEUR = activeNetwork ? balanceEUR(activeNetwork) : 0;
  const netSendable = activeNetwork ? maxSendable(activeNetwork) : 0;

  const handleNetworkChange = useCallback(async (network) => {
    if (!network) return;
    setActiveNetwork(network);
    if (user?.email) {
      await refreshBalance(user.email, network);
    }
    setToastMessage(`Switched to ${networkShortNames[network] || network.toUpperCase()}`);
    setTimeout(() => setToastMessage(""), 2000);
  }, [user, setActiveNetwork, refreshBalance]);

  const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const handleSend = () => {
    const trimmed = receiver.trim();
    if (!isValidAddress(trimmed)) {
      alert("Invalid receiver address.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      alert("Amount must be greater than 0.");
      return;
    }
    if (parsedAmount > netSendable) {
      alert(`Max sendable: ${netSendable.toFixed(6)} ${shortName}`);
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
        amount,
        network: activeNetwork,
      });

      if (result?.success) {
        setReceiver("");
        setAmount("");
        setTxHash(result.hash);
        if (user?.email) {
          await refreshBalance(user.email, activeNetwork);
        }
        setBalanceUpdated(true);
        setShowSuccess(true);
      } else {
        alert(result?.message || "Transaction failed.");
      }
    } catch (err) {
      console.error("Send transaction error:", err);
      alert("Unexpected error while sending.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (balanceUpdated) {
      const timer = setTimeout(() => setBalanceUpdated(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [balanceUpdated]);

  const buttonStyle = {
    backgroundColor: buttonColors[activeNetwork?.toLowerCase()] || "black",
    color: "white",
    border: "2px solid white",
    borderRadius: "14px",
    padding: "14px",
    fontWeight: "700",
    textTransform: "uppercase",
    fontFamily: "var(--font-crypto)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className={`${styles.main} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <AnimatePresence>
          {balanceUpdated && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className={styles.successAlert}>
              Balance Updated!
            </motion.div>
          )}
          {toastMessage && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className={styles.successAlert}>
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Transfer crypto securely & instantly</p>

        <SwipeSelector mode="send" onSelect={handleNetworkChange} />

        <div className={styles.balanceTable}>
          <p className={styles.whiteText}>
            Total Balance: <span className={styles.balanceAmount}>{netBalance.toFixed(6)} {shortName}</span> (~€{netEUR.toFixed(2)})
          </p>
          <p className={styles.whiteText}>
            Max Sendable: <span className={styles.balanceAmount}>{netSendable.toFixed(6)} {shortName}</span> (includes 3% fee)
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
            Recipient receives <strong>{amountAfterFee.toFixed(6)} {shortName}</strong> (after 3% fee)
          </p>
          <button
            onClick={handleSend}
            style={buttonStyle}
            disabled={!user || sending || !receiver || !amount}
          >
            {sending ? <div className={styles.loader}></div> : "SEND NOW"}
          </button>
        </div>

        {showConfirm && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <div className={styles.modalTitle}>Confirm Transaction</div>
              <div className={styles.modalInfo}>
                <p><strong>Network:</strong> {shortName}</p>
                <p><strong>Receiver:</strong> {receiver}</p>
                <p><strong>Send:</strong> {parsedAmount.toFixed(6)} {shortName}</p>
                <p><strong>Gets:</strong> {amountAfterFee.toFixed(6)} {shortName}</p>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.modalButton} onClick={confirmSend}>Confirm</button>
                <button className={`${styles.modalButton} ${styles.cancel}`} onClick={() => setShowConfirm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showSuccess && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
            <SuccessModal
              message="Transaction Completed!"
              txHash={txHash}
              networkKey={activeNetwork}
              onClose={() => setShowSuccess(false)}
            />
          </motion.div>
        )}
      </div>
    </motion.main>
  );
}
