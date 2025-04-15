"use client";

import { useState } from "react";
import { useSend } from "@/contexts/SendContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/components/sendmodal.module.css";

export default function SendModal({ onClose }) {
  const { sendTransaction, sending } = useSend();
  const { balances } = useBalance();
  const { activeNetwork } = useNetwork();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const balance = parseFloat(balances?.[activeNetwork] ?? 0);
  const isDisabled = !recipient || !amount || sending || confirmed;

  const handleSubmit = async () => {
    setError("");
    setConfirming(true);
  };

  const handleFinalSend = async () => {
    try {
      setConfirmed(true);
      const res = await sendTransaction({ recipient, amount });
      if (res?.error) throw new Error(res.error);
      onClose();
    } catch (err) {
      setError(err.message);
      setConfirmed(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Send {activeNetwork?.toUpperCase()} Tokens</h2>

        {!confirming ? (
          <>
            <input
              type="text"
              placeholder="Recipient address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={styles.input}
            />
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={styles.input}
            />
            <p className={styles.balance}>Your balance: {balance.toFixed(4)}</p>

            {error && <p className={styles.error}>❌ {error}</p>}

            <div className={styles.buttonGroup}>
              <button onClick={onClose} className={styles.cancelButton}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className={styles.confirmButton}
                disabled={isDisabled}
              >
                {sending ? <MiniLoadingSpinner /> : "Continue"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Recipient: <strong>{recipient}</strong></p>
            <p>Amount: <strong>{amount}</strong></p>
            <p>+ Admin Fee: 3%</p>
            <p>+ Gas Limit: 21000</p>

            <div className={styles.buttonGroup}>
              <button
                onClick={() => setConfirming(false)}
                className={styles.cancelButton}
              >
                Back
              </button>
              <button
                onClick={handleFinalSend}
                className={styles.confirmButton}
                disabled={sending}
              >
                {sending ? <MiniLoadingSpinner /> : "Confirm & Send"}
              </button>
            </div>

            {error && <p className={styles.error}>❌ {error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
