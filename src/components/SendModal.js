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

export default function StepModal({ onClose }) {
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
  const { activeNetwork, tokenSymbol } = useNetwork();
  const { ready, loading } = useSystemReady();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState(0);
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
    parsedAmount <= 0 ||
    parsedAmount + totalFee > balance ||
    !isValidAddress ||
    feeLoading;

  useEffect(() => {
    if (activeNetwork && parsedAmount > 0) {
      calculateFees({
        to: recipient.trim(),
        amount: parsedAmount,
      });
    }
  }, [activeNetwork, parsedAmount, recipient]);

  useEffect(() => {
    if (!recipient) return setIsValidAddress(false);
    setIsValidAddress(/^0x[a-fA-F0-9]{40}$/.test(recipient.trim()));
  }, [recipient]);

  useEffect(() => {
    setRecipient("");
    setAmount("");
    setStep(0);
    setError("");
    setSuccess(false);
    setTxHash(null);
  }, []);

  const handleMax = () => {
    const max = balance - totalFee;
    if (max > 0) setAmount(max.toFixed(6));
  };

  const handleSend = async () => {
    try {
      const tx = await sendTransaction({
        to: recipient.trim().toLowerCase(),
        amount: parsedAmount,
        userEmail: user.email,
      });
      setTxHash(tx);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Transaction failed.");
    }
  };

  const StepView = () => {
    if (loading || !ready) {
      return (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <MiniLoadingSpinner />
            <p className={styles.loadingText}>Preparing secure environment...</p>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <h2 className={styles.title}>
            Send {tokenSymbol} ({activeNetwork.toUpperCase()})
          </h2>

          {step === 0 && (
            <>
              <input
                type="text"
                placeholder="Recipient address (0x...)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className={styles.input}
                autoFocus
              />
              {!isValidAddress && recipient && (
                <p className={styles.warning}>⚠️ Invalid address format</p>
              )}
              <div className={styles.buttonGroup}>
                <button onClick={onClose} className={styles.cancelButton}>
                  Cancel
                </button>
                <button
                  onClick={() => setStep(1)}
                  className={styles.confirmButton}
                  disabled={!isValidAddress}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className={styles.amountRow}>
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={styles.input}
                  min="0"
                  step="0.0001"
                />
                <button onClick={handleMax} className={styles.maxButton}>
                  Max
                </button>
              </div>

              <p className={styles.balance}>
                Balance: {balance.toFixed(6)} {tokenSymbol}
              </p>

              {feeLoading ? (
                <p className={styles.info}>Calculating network fees...</p>
              ) : feeError ? (
                <p className={styles.error}>⚠️ {feeError}</p>
              ) : (
                <div className={styles.feeSummary}>
                  <p>
                    Total:{" "}
                    <strong>
                      {(parsedAmount + totalFee).toFixed(6)} {tokenSymbol}
                    </strong>
                  </p>
                  <p>Gas Fee: {gasFee.toFixed(6)}</p>
                  <p>Admin Fee: {adminFee.toFixed(6)}</p>
                </div>
              )}

              {error && <p className={styles.error}>❌ {error}</p>}

              <div className={styles.buttonGroup}>
                <button onClick={() => setStep(0)} className={styles.cancelButton}>
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className={styles.confirmButton}
                  disabled={isDisabled}
                >
                  Confirm
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.confirmBox}>
                <p>
                  <strong>Recipient:</strong> {recipient}
                </p>
                <p>
                  <strong>Amount:</strong> {parsedAmount.toFixed(6)} {tokenSymbol}
                </p>
                <p>
                  <strong>Gas Fee:</strong> {gasFee.toFixed(6)}
                </p>
                <p>
                  <strong>Admin Fee:</strong> {adminFee.toFixed(6)}
                </p>
                <p>
                  <strong>Total:</strong> {(parsedAmount + totalFee).toFixed(6)} {tokenSymbol}
                </p>
              </div>

              <div className={styles.buttonGroup}>
                <button onClick={() => setStep(1)} className={styles.cancelButton}>
                  Back
                </button>
                <button
                  onClick={handleSend}
                  className={styles.confirmButton}
                  disabled={sending}
                >
                  {sending ? <MiniLoadingSpinner /> : "Send"}
                </button>
              </div>

              {error && <p className={styles.error}>❌ {error}</p>}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <StepView />
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
      {error && step === 0 && (
        <ErrorModal error={error} onClose={() => setError("")} />
      )}
    </>
  );
}
