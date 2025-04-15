"use client";

import { useState, useEffect } from "react";
import { useSend } from "@/contexts/SendContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSystemReady } from "@/hooks/useSystemReady";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/components/sendmodal.module.css";

export default function SendModal({ onClose }) {
  const { sendTransaction, sending } = useSend();
  const { balances } = useBalance();
  const { activeNetwork } = useNetwork();
  const { ready, loading } = useSystemReady();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [isValidAddress, setIsValidAddress] = useState(false);

  const balance = parseFloat(balances?.[activeNetwork] ?? 0);
  const feePercent = 0.03;
  const gasLimit = 21000;
  const estimatedFee = (parseFloat(amount || "0") * feePercent).toFixed(6);
  const totalAmount = (parseFloat(amount || "0") + parseFloat(estimatedFee)).toFixed(6);

  const isDisabled =
    !recipient ||
    !amount ||
    sending ||
    confirmed ||
    parseFloat(amount) <= 0 ||
    parseFloat(totalAmount) > balance ||
    !isValidAddress;

  // ✅ Validate recipient address (simple regex)
  useEffect(() => {
    if (!recipient) {
      setIsValidAddress(false);
      return;
    }
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(recipient.trim());
    setIsValidAddress(isValid);
  }, [recipient]);

  // ✅ Reset states on reopen
  useEffect(() => {
    setRecipient("");
    setAmount("");
    setConfirming(false);
    setConfirmed(false);
    setError("");
  }, []);

  const handleSubmit = () => {
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

  const handleMax = () => {
    const maxAmount = (balance / (1 + feePercent)).toFixed(6);
    setAmount(maxAmount);
  };

  if (loading || !ready) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <MiniLoadingSpinner />
          <p className={styles.loadingText}>Preparing transaction...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Send {activeNetwork?.toUpperCase()} Tokens</h2>

        {!confirming ? (
          <>
            <input
              type="text"
              placeholder="Recipient address (0x...)"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={styles.input}
            />
            <div className={styles.amountRow}>
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={styles.input}
              />
              <button onClick={handleMax} className={styles.maxButton}>
                Max
              </button>
            </div>

            <p className={styles.balance}>
              Your balance: {balance.toFixed(4)} {activeNetwork?.toUpperCase()}
            </p>

            {!isValidAddress && recipient && (
              <p className={styles.warning}>⚠️ Invalid address format</p>
            )}

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
            <p>Amount: <strong>{amount} {activeNetwork?.toUpperCase()}</strong></p>
            <p>Admin Fee (3%): <strong>{estimatedFee}</strong></p>
            <p>Total Deducted: <strong>{totalAmount}</strong></p>
            <p>Gas Limit: <strong>{gasLimit}</strong></p>

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
