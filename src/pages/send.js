// src/app/send.js
"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect } from "react";
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

// — Network labels, minimums & button colors
const NETWORKS = {
  eth:  { label: "ETH",   min: 0.001,    color: "#0072ff" },
  bnb:  { label: "BNB",   min: 0.0005,   color: "#f0b90b" },
  tbnb: { label: "tBNB",  min: 0.0005,   color: "#f0b90b" },
  matic:{ label: "MATIC", min: 0.1,      color: "#8247e5" },
  avax: { label: "AVAX",  min: 0.01,     color: "#e84142" },
};

export default function SendPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeNetwork, switchNetwork } = useNetwork();
  const { ready, loading } = useSystemReady();

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

  const { balances, getUsdBalance, getEurBalance } = useBalance();

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  // Derive everything from activeNetwork
  const { label: shortName, min, color } = NETWORKS[activeNetwork] || {};
  const parsedAmount = Number(amount) || 0;
  const netBalance = balances?.[activeNetwork] || 0;
  const balanceEur = getEurBalance?.(activeNetwork) || "0.00";
  const balanceUsd = getUsdBalance?.(activeNetwork) || "0.00";

  // Validate address (0x…40 hex chars)
  const isValidAddress = (addr) =>
    /^0x[a-fA-F0-9]{40}$/.test(addr.trim());

  // Recalculate fees whenever network or amount changes
  useEffect(() => {
    if (activeNetwork && parsedAmount > 0) {
      calculateFees(activeNetwork, parsedAmount);
    }
  }, [activeNetwork, parsedAmount, calculateFees]);

  const handleNetworkChange = (net) => {
    switchNetwork(net);
    setReceiver("");
    setAmount("");
    setToastMessage(`Switched to ${NETWORKS[net]?.label || net.toUpperCase()}`);
    setShowToast(true);
    navigator.vibrate?.(30);
    setTimeout(() => setShowToast(false), 1500);
  };

  const handleSend = () => {
    if (!isValidAddress(receiver)) {
      return alert("❌ Invalid wallet address");
    }
    if (parsedAmount < min) {
      return alert(`❌ Minimum is ${min} ${shortName}`);
    }
    if (parsedAmount + totalFee > netBalance) {
      return alert("❌ Insufficient balance");
    }
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    setError(null);

    try {
      console.log("🚀 Sending on", activeNetwork, "to", receiver, parsedAmount);
      const hash = await sendTransaction({
        to: receiver.trim().toLowerCase(),
        amount: parsedAmount,
        network: activeNetwork,    // <— make sure context uses this
        userEmail: user.email,
      });
      setTxHash(hash);
      setReceiver("");
      setAmount("");
      setShowSuccess(true);
      navigator.vibrate?.(80);
    } catch (err) {
      console.error("❌ send error:", err);
      setError(err.message || "Transaction failed");
    }
  };

  useEffect(() => {
    if (!user && ready) router.replace("/");
  }, [user, ready, router]);

  if (loading) {
    return (
      <div className={styles.loader}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  return (
    <main className={`${styles.main} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <SuccessToast show={showToast} message={toastMessage} networkKey={activeNetwork} />

        {/* 🔀 Network Switcher */}
        <SwipeSelector selected={activeNetwork} onSelect={handleNetworkChange} />

        {/* 💰 Balances */}
        <div className={styles.balanceTable}>
          <p>Your Balance: <strong>{netBalance.toFixed(6)} {shortName}</strong></p>
          <p>≈ €{balanceEur} | ≈ ${balanceUsd}</p>
        </div>

        {/* 💼 Inputs */}
        <div className={styles.walletActions}>
          <input
            type="text"
            placeholder="Receiver address"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className={styles.inputField}
            disabled={sending}
          />
          <input
            type="number"
            placeholder="Amount to send"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
            disabled={sending}
            min="0"
          />

          {/* ⚙️ Fees */}
          <div className={styles.feesInfo}>
            {feeLoading
              ? <p>Calculating fees…</p>
              : feeError
                ? <p style={{ color: "red" }}>Fee error.</p>
                : <>
                    <p>Total: {(parsedAmount + totalFee).toFixed(6)} {shortName}</p>
                    <p>Min: {min} {shortName}</p>
                  </>
            }
          </div>

          {/* ▶️ Send Button */}
          <button
            onClick={handleSend}
            disabled={!receiver || sending || feeLoading}
            style={{
              backgroundColor: color,
              color: (activeNetwork==="bnb"||activeNetwork==="tbnb") ? "#000":"#fff",
              border: "2px solid white",
              width:"100%", padding:"12px",
              fontSize:"18px", borderRadius:"12px",
              boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
              marginTop:"16px",
            }}
          >
            {sending ? <MiniLoadingSpinner size={20} color="#fff" /> : "SEND NOW"}
          </button>
        </div>

        {/* ✔️ Confirm Modal */}
        {showConfirm && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <h3>Confirm Transaction</h3>
              <p><b>Network:</b> {shortName}</p>
              <p><b>To:</b> {receiver}</p>
              <p><b>Amount:</b> {parsedAmount.toFixed(6)} {shortName}</p>
              <p><b>Gas Fee:</b> {gasFee.toFixed(6)} {shortName}</p>
              <p><b>Admin Fee:</b> {adminFee.toFixed(6)} {shortName}</p>
              <p><b>Total:</b> {(parsedAmount+totalFee).toFixed(6)} {shortName}</p>
              <div className={styles.modalActions}>
                <button onClick={confirmSend} disabled={sending}>
                  {sending ? "Confirming…" : "Confirm"}
                </button>
                <button onClick={() => setShowConfirm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* 🎉 Success / ❌ Error */}
        {showSuccess && txHash && (
          <SuccessModal
            message="✅ Transaction Successful!"
            transactionHash={txHash}
            network={activeNetwork}
            onClose={() => setShowSuccess(false)}
          />
        )}
        {error && <ErrorModal error={error} onClose={() => setError(null)} />}
      </div>
    </main>
  );
}
