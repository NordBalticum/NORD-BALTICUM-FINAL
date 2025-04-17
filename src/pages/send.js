// src/app/send.js
"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSend } from "@/contexts/SendContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";
import { useScale } from "@/hooks/useScale";

import SwipeSelector from "@/components/SwipeSelector";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SuccessModal from "@/components/modals/SuccessModal";
import ErrorModal from "@/components/modals/ErrorModal";
import SuccessToast from "@/components/SuccessToast";

import styles from "@/styles/send.module.css";

// — Network metadata
const NETWORKS = {
  eth:   { label: "ETH",   min: 0.001,  explorer: "https://etherscan.io/tx/" },
  bnb:   { label: "BNB",   min: 0.0005, explorer: "https://bscscan.com/tx/" },
  tbnb:  { label: "tBNB",  min: 0.0005, explorer: "https://testnet.bscscan.com/tx/" },
  matic: { label: "MATIC", min: 0.1,    explorer: "https://polygonscan.com/tx/" },
  avax:  { label: "AVAX",  min: 0.01,   explorer: "https://snowtrace.io/tx/" },
};

export default function SendPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeNetwork, switchNetwork } = useNetwork();
  const { ready, loading: sysLoading } = useSystemReady();
  const scale = useScale();

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

  const { balances, prices } = useBalance();

  // UI state
  const [receiver, setReceiver]       = useState("");
  const [amount, setAmount]           = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [toast, setToast]             = useState({ show: false, msg: "" });
  const [error, setError]             = useState(null);
  const [txHash, setTxHash]           = useState("");

  // Derived config
  const cfg    = NETWORKS[activeNetwork] || {};
  const { label: short, min, explorer } = cfg;
  const val    = useMemo(() => parseFloat(amount) || 0, [amount]);
  const bal    = useMemo(() => balances?.[activeNetwork] || 0, [balances, activeNetwork]);

  // Fiat conversions
  const eurBal = useMemo(() => {
    const rate = prices?.[activeNetwork]?.eur ?? 0;
    return (bal * rate).toFixed(2);
  }, [prices, activeNetwork, bal]);

  const usdBal = useMemo(() => {
    const rate = prices?.[activeNetwork]?.usd ?? 0;
    return (bal * rate).toFixed(2);
  }, [prices, activeNetwork, bal]);

  // Address validator
  const isValidAddress = useCallback(addr =>
    /^0x[a-fA-F0-9]{40}$/.test(addr.trim()), []
  );

  // Recalculate fees when network or amount changes
  useEffect(() => {
    if (val > 0) calculateFees(activeNetwork, val);
  }, [activeNetwork, val, calculateFees]);

  // Redirect if not authenticated once system is ready
  useEffect(() => {
    if (ready && !user) {
      router.replace("/");
    }
  }, [ready, user, router]);

  // Global loader until system ready
  if (sysLoading) {
    return (
      <div className={styles.loader}>
        <MiniLoadingSpinner size={40} />
      </div>
    );
  }

  // Handle network switch
  const onNetworkSelect = useCallback(sym => {
    if (sym !== activeNetwork) {
      switchNetwork(sym);
      setReceiver("");
      setAmount("");
      setToast({ show: true, msg: `Switched to ${NETWORKS[sym].label}` });
      navigator.vibrate?.(30);
      setTimeout(() => setToast({ show: false, msg: "" }), 1200);
    }
  }, [activeNetwork, switchNetwork]);

  // Validate inputs and open confirm modal
  const onSendClick = useCallback(() => {
    if (!isValidAddress(receiver)) {
      alert("❌ Invalid address");
      return;
    }
    if (val < min) {
      alert(`❌ Minimum is ${min} ${short}`);
      return;
    }
    if (val + totalFee > bal) {
      alert("❌ Insufficient balance");
      return;
    }
    setConfirmOpen(true);
  }, [receiver, val, min, short, totalFee, bal, isValidAddress]);

  // Confirm and execute transaction
  const onConfirm = useCallback(async () => {
    setConfirmOpen(false);
    setError(null);
    try {
      const hash = await sendTransaction({
        to: receiver.trim().toLowerCase(),
        amount: val,
        userEmail: user.email,
      });
      setTxHash(hash);
      setReceiver("");
      setAmount("");
      setSuccessOpen(true);
      navigator.vibrate?.(80);
    } catch (e) {
      setError(e.message || "Transaction failed");
    }
  }, [receiver, val, user, sendTransaction]);

  return (
    <main
      className={styles.main}
      style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
    >
      <div className={styles.wrapper}>
        <SuccessToast show={toast.show} message={toast.msg} networkKey={activeNetwork} />

        {/* Network Selector */}
        <SwipeSelector onSelect={onNetworkSelect} />

        {/* Balances */}
        <div className={styles.balanceTable}>
          <p>Your Balance: <strong>{bal.toFixed(6)} {short}</strong></p>
          <p>≈ €{eurBal} | ≈ ${usdBal}</p>
        </div>

        {/* Inputs & Fees */}
        <div className={styles.walletActions}>
          <input
            type="text"
            aria-label="Receiver address"
            placeholder="0x..."
            value={receiver}
            onChange={e => setReceiver(e.target.value)}
            disabled={sending}
            className={styles.inputField}
          />
          <input
            type="number"
            aria-label="Amount to send"
            placeholder="0.0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={sending}
            className={styles.inputField}
            min="0"
          />

          <div className={styles.feesInfo}>
            {feeLoading ? (
              <p><MiniLoadingSpinner size={14} /> Calculating fees…</p>
            ) : feeError ? (
              <p style={{ color: "var(--gold)" }}>Fee error: {feeError}</p>
            ) : (
              <>
                <p>Total: {(val + totalFee).toFixed(6)} {short}</p>
                <p>Min: {min} {short}</p>
              </>
            )}
          </div>

          <button
            onClick={onSendClick}
            disabled={!receiver || sending || feeLoading}
            aria-busy={sending}
            className={styles.sendNowButton}
          >
            {sending
              ? <MiniLoadingSpinner size={20} color="var(--text-primary)" />
              : "SEND NOW"
            }
          </button>
        </div>

        {/* Confirm Modal */}
        {confirmOpen && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal} role="dialog" aria-modal="true">
              <h3 className={styles.modalTitle}>Confirm Transaction</h3>
              <div className={styles.modalInfo}>
                <p><strong>Network:</strong> {short}</p>
                <p><strong>To:</strong> {receiver}</p>
                <p><strong>Amount:</strong> {val.toFixed(6)} {short}</p>
                <p><strong>Gas Fee:</strong> {gasFee.toFixed(6)} {short}</p>
                <p><strong>Admin Fee:</strong> {adminFee.toFixed(6)} {short}</p>
                <p><strong>Total:</strong> {(val + totalFee).toFixed(6)} {short}</p>
              </div>
              <div className={styles.modalActions}>
                <button
                  onClick={onConfirm}
                  disabled={sending}
                  className={styles.modalButton}
                >
                  {sending ? "Processing…" : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmOpen(false)}
                  className={`${styles.modalButton} ${styles.cancel}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success & Error */}
        {successOpen && txHash && (
          <SuccessModal
            message="✅ Transaction Sent!"
            transactionHash={txHash}
            explorerUrl={`${explorer}${txHash}`}
            onClose={() => setSuccessOpen(false)}
          />
        )}
        {error && (
          <ErrorModal error={error} onClose={() => setError(null)} />
        )}
      </div>
    </main>
  );
}
