"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
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

// Mygtuko spalvos pagal tinklą
const buttonColors = {
  eth: "#0072ff",    // Mėlynas
  bnb: "#f0b90b",    // Geltonas
  tbnb: "#f0b90b",   // Testnet irgi geltonas kaip BNB
  matic: "#8247e5",  // Violetinis
  avax: "#e84142",   // Raudonas
};

export default function Send() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { activeNetwork, setActiveNetwork } = useWallet();
  const { balance, balanceEUR, maxSendable, refreshBalance, loading } = useBalances();
  const { sendTransaction } = useSendCrypto();

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [balanceUpdated, setBalanceUpdated] = useState(false);

  // Užkraunam ETH kaip default
  useEffect(() => {
    if (!activeNetwork) {
      setActiveNetwork("eth");
    }
  }, [activeNetwork, setActiveNetwork]);

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
  }, [user, setActiveNetwork, refreshBalance]);

  useEffect(() => {
    if (!user) router.replace("/");
  }, [user, router]);

  const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const handleSend = () => {
    const trimmed = receiver.trim();

    if (!trimmed || !isValidAddress(trimmed)) {
      alert("Invalid receiver address.");
      return;
    }

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Amount must be a positive number.");
      return;
    }

    if (parsedAmount > netSendable) {
      alert(`Max sendable: ${netSendable.toFixed(6)} ${shortName}`);
      return;
    }

    if (parsedAmount > netBalance) {
      alert(`Insufficient balance. You have only ${netBalance.toFixed(6)} ${shortName}.`);
      return;
    }

    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    setSending(true);

    const result = await sendTransaction({
      sender: user?.email,
      receiver: receiver.trim(),
      amount,
      network: activeNetwork,
    });

    setSending(false);

    if (result?.success) {
      setReceiver("");
      setAmount("");
      setTxHash(result.hash);
      await refreshBalance(user.email, activeNetwork);
      setBalanceUpdated(true);
      setShowSuccess(true);
    } else {
      alert(result?.message || "Transaction failed");
    }
  };

  useEffect(() => {
    if (balanceUpdated) {
      const timer = setTimeout(() => setBalanceUpdated(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [balanceUpdated]);

  // Dinaminė mygtuko spalva
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
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`${styles.main} ${background.gradient}`}
    >
      <div className={styles.wrapper}>
        {balanceUpdated && (
          <div className={styles.successAlert}>
            Balance Updated!
          </div>
        )}

        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Transfer crypto securely & instantly</p>

        <SwipeSelector mode="send" onSelect={handleNetworkChange} />

        <div className={styles.balanceTable}>
          {loading ? (
            <div className={styles.skeletonWrapper}>
              <div className={styles.skeletonLine}></div>
              <div className={styles.skeletonLine}></div>
            </div>
          ) : (
            <>
              {activeNetwork && (
                <>
                  <motion.p
                    className={styles.whiteText}
                    key={`balance-${activeNetwork}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    Total Balance:&nbsp;
                    <span className={styles.balanceAmount}>
                      {netBalance.toFixed(6)} {shortName}
                    </span>{" "}
                    (~€{netEUR.toFixed(2)})
                  </motion.p>

                  <motion.p
                    className={styles.whiteText}
                    key={`sendable-${activeNetwork}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    Max Sendable:&nbsp;
                    <span className={styles.balanceAmount}>
                      {netSendable.toFixed(6)} {shortName}
                    </span>{" "}
                    (includes 3% fee)
                  </motion.p>
                </>
              )}
            </>
          )}
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
            Recipient receives <strong>{amountAfterFee.toFixed(6)} {shortName}</strong>
            <br />Includes 3% platform fee.
          </p>

          <button
            onClick={handleSend}
            style={buttonStyle}
            disabled={!user || sending || !receiver || !amount}
          >
            {sending ? (
              <div className={styles.loader}></div>
            ) : (
              "SEND NOW"
            )}
          </button>
        </div>

        {showConfirm && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <div className={styles.modalTitle}>Final Confirmation</div>
              <div className={styles.modalInfo}>
                <p><strong>Network:</strong> {shortName}</p>
                <p><strong>To:</strong> {receiver}</p>
                <p><strong>Send:</strong> {parsedAmount.toFixed(6)} {shortName}</p>
                <p><strong>Gets:</strong> {amountAfterFee.toFixed(6)} {shortName}</p>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.modalButton} onClick={confirmSend}>Confirm</button>
                <button
                  className={`${styles.modalButton} ${styles.cancel}`}
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccess && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <SuccessModal
              message="Transaction completed!"
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
