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

import SwipeSelector from "@/components/SwipeSelector";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SuccessModal from "@/components/modals/SuccessModal";
import ErrorModal from "@/components/modals/ErrorModal";
import SuccessToast from "@/components/SuccessToast";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

// network metadata
const NETWORKS = {
  eth:   { label: "ETH",   min: 0.001,  color: "#0072ff", explorer: "https://etherscan.io/tx/" },
  bnb:   { label: "BNB",   min: 0.0005, color: "#f0b90b", explorer: "https://bscscan.com/tx/" },
  tbnb:  { label: "tBNB",  min: 0.0005, color: "#f0b90b", explorer: "https://testnet.bscscan.com/tx/" },
  matic: { label: "MATIC", min: 0.1,    color: "#8247e5", explorer: "https://polygonscan.com/tx/" },
  avax:  { label: "AVAX",  min: 0.01,   color: "#e84142", explorer: "https://snowtrace.io/tx/" },
};

export default function SendPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeNetwork, switchNetwork } = useNetwork();
  const { ready, loading: sysLoading } = useSystemReady();

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

  // derive config
  const cfg    = useMemo(() => NETWORKS[activeNetwork] || {}, [activeNetwork]);
  const { label: short, min, color: btnClr, explorer } = cfg;
  const val    = useMemo(() => parseFloat(amount) || 0, [amount]);
  const bal    = useMemo(() => balances?.[activeNetwork] || 0, [balances, activeNetwork]);

  // compute fiat balances
  const eurBal = useMemo(() => {
    const rate = prices?.[activeNetwork]?.eur ?? 0;
    return (bal * rate).toFixed(2);
  }, [prices, activeNetwork, bal]);

  const usdBal = useMemo(() => {
    const rate = prices?.[activeNetwork]?.usd ?? 0;
    return (bal * rate).toFixed(2);
  }, [prices, activeNetwork, bal]);

  const isValidAddress = useCallback(addr =>
    /^0x[a-fA-F0-9]{40}$/.test(addr.trim()), []
  );

  // recalc fees
  useEffect(() => {
    if (val > 0) calculateFees(activeNetwork, val);
  }, [activeNetwork, val, calculateFees]);

  // redirect if not logged-in once ready
  useEffect(() => {
    if (ready && !user) {
      router.replace("/");
    }
  }, [user, ready, router]);

  // show spinner during system init
  if (sysLoading) {
    return (
      <div className={styles.loader}>
        <MiniLoadingSpinner size={40} />
      </div>
    );
  }

  const switchNet = useCallback(net => {
    switchNetwork(net);
    setReceiver("");
    setAmount("");
    setToast({ show: true, msg: `Switched to ${NETWORKS[net].label}` });
    navigator.vibrate?.(30);
    setTimeout(() => setToast({ show: false, msg: "" }), 1200);
  }, [switchNetwork]);

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
    <main className={`${styles.main} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <SuccessToast show={toast.show} message={toast.msg} networkKey={activeNetwork} />

        <SwipeSelector selected={activeNetwork} onSelect={switchNet} />

        <div className={styles.balanceTable}>
          <p>Your Balance: <strong>{bal.toFixed(6)} {short}</strong></p>
          <p>≈ €{eurBal} | ≈ ${usdBal}</p>
        </div>

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
              <p style={{ color: "red" }}>Fee error: {feeError}</p>
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
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: btnClr,
              color: (activeNetwork === "bnb" || activeNetwork === "tbnb") ? "#000" : "#fff",
              border: "2px solid #fff",
              padding: "12px 0",
              fontSize: "18px",
              width: "100%",
              marginTop: "16px",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}
          >
            {sending ? <MiniLoadingSpinner size={20} color="#fff" /> : "SEND NOW"}
          </button>
        </div>

        {confirmOpen && (
  <div className={styles.overlay}>
    <div className={styles.confirmModal} role="dialog" aria-modal="true">
      <h3>Confirm Transaction</h3>
      <p><strong>Network:</strong> {short}</p>
      <p><strong>To:</strong> {receiver}</p>
      <p><strong>Amount:</strong> {val.toFixed(6)} {short}</p>
      <p><strong>Gas Fee:</strong> {gasFee.toFixed(6)} {short}</p>
      <p><strong>Admin Fee:</strong> {adminFee.toFixed(6)} {short}</p>
      <p><strong>Total:</strong> {(val + totalFee).toFixed(6)} {short}</p>
      <div className={styles.modalActions}>
        <button onClick={onConfirm} disabled={sending}>
          {sending ? "Processing…" : "Confirm"}
        </button>
        <button onClick={() => setConfirmOpen(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}
