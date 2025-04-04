"use client";

import { useEffect, useState, useMemo } from "react";
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

export default function Send() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { activeNetwork, setActiveNetwork } = useWallet();
  const { balance, balanceEUR, maxSendable, refreshBalance, loading } = useBalances(); // <--- svarbu gauti loading!
  const { sendTransaction } = useSendCrypto();

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  const parsedAmount = Number(amount || 0);
  const fee = parsedAmount * 0.03;
  const amountAfterFee = parsedAmount - fee;

  const shortName = useMemo(() => networkShortNames[activeNetwork?.toLowerCase()] || "", [activeNetwork]);
  const netBalance = useMemo(() => Number(balance(activeNetwork) || 0), [balance, activeNetwork]);
  const netEUR = useMemo(() => Number(balanceEUR(activeNetwork) || 0), [balanceEUR, activeNetwork]);
  const netSendable = useMemo(() => Number(maxSendable(activeNetwork) || 0), [maxSendable, activeNetwork]);

  useEffect(() => {
    if (!user) router.replace("/");
  }, [user, router]);

  useEffect(() => {
    if (user?.email && activeNetwork) {
      refreshBalance(user.email, activeNetwork);
    }
  }, [user?.email, activeNetwork, refreshBalance]);

  useEffect(() => {
    if (user?.email && activeNetwork) {
      const interval = setInterval(() => {
        refreshBalance(user.email, activeNetwork);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.email, activeNetwork, refreshBalance]);

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
      refreshBalance(user.email, activeNetwork);
      setTxHash(result.hash);
      setShowSuccess(true);
    } else {
      alert(result?.message || "Transaction failed");
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`${styles.main} ${background.gradient}`}
    >
      <div className={styles.wrapper}>
        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Transfer crypto securely & instantly</p>

        <SwipeSelector mode="send" onSelect={setActiveNetwork} />

        <div className={styles.balanceTable}>
          {!loading && (
            <>
              <motion.p
                className={styles.whiteText}
                key={netBalance}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                Total Balance: <strong>{netBalance.toFixed(6)} {shortName}</strong> (~€{netEUR.toFixed(2)})
              </motion.p>
              <motion.p
                className={styles.whiteText}
                key={netSendable}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                Max Sendable: <strong>{netSendable.toFixed(6)} {shortName}</strong> (includes 3% fee)
              </motion.p>
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
            className={styles.confirmButton}
            disabled={!user || sending}
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
