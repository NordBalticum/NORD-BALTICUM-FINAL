"use client";

import { useState, useEffect } from "react";
import { useSend } from "@/contexts/SendContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemReady } from "@/hooks/useSystemReady";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SuccessModal from "@/components/modals/SuccessModal";
import ErrorModal from "@/components/modals/ErrorModal";

import styles from "@/components/sendmodal.module.css";

export default function SendModal({ onClose }) {
  const { user } = useAuth();
  const {
    sendTransaction,
    sending,
    gasFee,
    adminFee,
    totalFee,
    feeLoading,
    feeError,
    calculateFees,
  } = useSend();
  const { balances } = useBalance();
  const { activeNetwork } = useNetwork();
  const { ready, loading } = useSystemReady();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [isValidAddress, setIsValidAddress] = useState(false);

  const balance = parseFloat(balances?.[activeNetwork] ?? 0);
  const parsedAmount = parseFloat(amount || "0");

  const isDisabled =
    !recipient ||
    !amount ||
    sending ||
    confirmed ||
    parsedAmount <= 0 ||
    parsedAmount + totalFee > balance ||
    !isValidAddress ||
    feeLoading;

  useEffect(() => {
    if (activeNetwork && parsedAmount > 0) {
      calculateFees(activeNetwork, parsedAmount);
    }
  }, [activeNetwork, parsedAmount]);

  useEffect(() => {
    if (!recipient) return setIsValidAddress(false);
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(recipient.trim());
    setIsValidAddress(isValid);
  }, [recipient]);

  useEffect(() => {
    setRecipient("");
    setAmount("");
    setConfirming(false);
    setConfirmed(false);
    setError("");
    setSuccess(false);
    setTxHash(null);
  }, []);

  const handleMax = () => {
    const max = balance - totalFee;
    if (max > 0) setAmount(max.toFixed(6));
  };

  const handleSubmit = () => {
    setError("");
    setConfirming(true);
  };

  const handleFinalSend = async () => {
    try {
      setConfirmed(true);
      const tx = await sendTransaction({
        to: recipient.trim().toLowerCase(),
        amount: parsedAmount,
        userEmail: user.email,
      });
      setTxHash(tx);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Transaction failed.");
      setConfirmed(false);
    }
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
    <>
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
                Balance: {balance.toFixed(6)} {activeNetwork?.toUpperCase()}
              </p>

              {feeLoading ? (
                <p>Calculating fees...</p>
              ) : feeError ? (
                <p className={styles.error}>⚠️ {feeError}</p>
              ) : (
                <>
                  <p>
                    Total: {(parsedAmount + totalFee).toFixed(6)}{" "}
                    {activeNetwork?.toUpperCase()}
                  </p>
                  <p>Gas Fee: {gasFee.toFixed(6)}</p>
                  <p>Admin Fee: {adminFee.toFixed(6)}</p>
                </>
              )}

              {!isValidAddress && recipient && (
                <p className={styles.warning}>⚠️ Invalid address</p>
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
              <p>
                Recipient: <strong>{recipient}</strong>
              </p>
              <p>
                Amount:{" "}
                <strong>
                  {parsedAmount.toFixed(6)} {activeNetwork?.toUpperCase()}
                </strong>
              </p>
              <p>
                Admin Fee: <strong>{adminFee.toFixed(6)}</strong>
              </p>
              <p>
                Gas Fee: <strong>{gasFee.toFixed(6)}</strong>
              </p>
              <p>
                Total: <strong>{(parsedAmount + totalFee).toFixed(6)}</strong>
              </p>

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

      {/* ✅ Success Modal */}
      {success && txHash && (
        <SuccessModal
          message="✅ Transaction Successful!"
          onClose={() => {
            setSuccess(false);
            setTxHash(null);
            onClose();
          }}
          transactionHash={txHash}
          network={activeNetwork}
        />
      )}

      {/* ❌ Error Modal */}
      {error && !confirming && (
        <ErrorModal
          error={error}
          onClose={() => {
            setError("");
          }}
        />
      )}
    </>
  );
}
