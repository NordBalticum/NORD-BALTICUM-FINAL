"use client";

export const dynamic = "force-dynamic";

// 1️⃣ IMPORTAI
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

// 2️⃣ NETWORK KONFIG
const networkShortNames = {
  eth: "ETH",
  bnb: "BNB",
  tbnb: "tBNB",
  matic: "MATIC",
  avax: "AVAX",
};

const minAmounts = {
  eth: 0.001,
  bnb: 0.0005,
  tbnb: 0.0005,
  matic: 0.1,
  avax: 0.01,
};

const buttonColors = {
  eth: "#0072ff",
  bnb: "#f0b90b",
  tbnb: "#f0b90b",
  matic: "#8247e5",
  avax: "#e84142",
};

// 3️⃣ SEND PAGE
export default function SendPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeNetwork, switchNetwork } = useNetwork();
  const { ready, loading } = useSystemReady();

  // ✅ Hook'ai tik jeigu window yra
  const { sendTransaction, sending, gasFee, adminFee, totalFee, feeLoading, feeError } = typeof window !== "undefined" ? useSend() : {};
  const { balances, getUsdBalance, getEurBalance } = typeof window !== "undefined" ? useBalance() : {};

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [error, setError] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);

  const shortName = useMemo(() => networkShortNames[activeNetwork] || activeNetwork.toUpperCase(), [activeNetwork]);
  const parsedAmount = useMemo(() => Number(amount) || 0, [amount]);
  const netBalance = useMemo(() => balances?.[activeNetwork] || 0, [balances, activeNetwork]);
  const balanceEur = getEurBalance?.(activeNetwork) || "0.00";
  const balanceUsd = getUsdBalance?.(activeNetwork) || "0.00";

  const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const handleNetworkChange = (selectedNetwork) => {
    if (!selectedNetwork) return;
    switchNetwork(selectedNetwork);
    setReceiver("");
    setAmount("");
    setToastMessage(`Switched to ${networkShortNames[selectedNetwork] || selectedNetwork.toUpperCase()}`);
    setShowToast(true);
    if (typeof window !== "undefined" && "vibrate" in navigator) navigator.vibrate(30);
    setTimeout(() => setShowToast(false), 1500);
  };

  const handleSend = () => {
    if (!isValidAddress(receiver)) {
      alert("❌ Invalid wallet address.");
      return;
    }
    if (parsedAmount <= 0 || parsedAmount < minAmounts[activeNetwork]) {
      alert(`❌ Minimum to send is ${minAmounts[activeNetwork]} ${shortName}`);
      return;
    }
    if (parsedAmount + totalFee > netBalance) {
      alert(`❌ Insufficient balance. Required: ${(parsedAmount + totalFee).toFixed(6)} ${shortName}`);
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    setError(null);
    try {
      if (typeof window !== "undefined" && user?.email) {
        const txHash = await sendTransaction({
          to: receiver.trim().toLowerCase(),
          amount: parsedAmount,
          network: activeNetwork,
          userEmail: user.email,
        });
        setTransactionHash(txHash);
        setReceiver("");
        setAmount("");
        setShowSuccess(true);
        if ("vibrate" in navigator) navigator.vibrate(80);
      }
    } catch (err) {
      console.error("❌ Transaction error:", err?.message || err);
      setError(err?.message || "Transaction failed.");
    }
  };

  const handleRetry = () => setError(null);

  useEffect(() => {
    if (!user && ready) {
      router.replace("/");
    }
  }, [user, ready, router]);

  if (loading) {
    return (
      <div className={styles.loader}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  const sendButtonStyle = {
    backgroundColor: buttonColors[activeNetwork] || "#ffffff",
    color: activeNetwork === "bnb" || activeNetwork === "tbnb" ? "#000000" : "#ffffff",
    border: "2px solid white",
    width: "100%",
    padding: "12px",
    fontSize: "18px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.3s ease",
    marginTop: "16px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <main className={`${styles.main} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <SuccessToast show={showToast} message={toastMessage} networkKey={activeNetwork} />

        {/* ✅ Tinklo pasirinkimas */}
        <SwipeSelector selected={activeNetwork} onSelect={handleNetworkChange} />

        {/* ✅ Balansas */}
        <div className={styles.balanceTable}>
          <p className={styles.whiteText}>
            Your Balance: <span className={styles.balanceAmount}>{netBalance.toFixed(6)} {shortName}</span>
          </p>
          <p className={styles.whiteText}>
            ≈ €{balanceEur} | ≈ ${balanceUsd}
          </p>
        </div>

        {/* ✅ Forma */}
        <div className={styles.walletActions}>
          <input
            type="text"
            placeholder="Receiver address"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className={styles.inputField}
            disabled={sending}
            autoComplete="off"
            spellCheck="false"
          />
          <input
            type="number"
            placeholder="Amount to send"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
            disabled={sending}
            autoComplete="off"
            spellCheck="false"
            min="0"
          />

          <div className={styles.feesInfo}>
            {feeLoading ? (
              <p className={styles.whiteText}>Calculating Fees...</p>
            ) : feeError ? (
              <p style={{ color: "red" }}>Failed to load fees.</p>
            ) : (
              <>
                <p className={styles.whiteText}>
                  Estimated Total Fees: {(gasFee + adminFee).toFixed(6)} {shortName}
                </p>
                <p className={styles.minimumText}>
                  Minimum to send: {minAmounts[activeNetwork]} {shortName}
                </p>
              </>
            )}
          </div>

          {/* ✅ Mygtukas */}
          <button
            onClick={handleSend}
            disabled={!receiver || sending || feeLoading}
            style={sendButtonStyle}
          >
            {sending ? (
              <MiniLoadingSpinner size={20} color="#fff" />
            ) : (
              "SEND NOW"
            )}
          </button>
        </div>

        {/* ✅ Confirm Modal */}
        {showConfirm && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <div className={styles.modalTitle}>Confirm Transaction</div>
              <div className={styles.modalInfo}>
                <p><strong>Network:</strong> {shortName}</p>
                <p><strong>Receiver:</strong> {receiver}</p>
                <p><strong>Amount:</strong> {parsedAmount.toFixed(6)} {shortName}</p>
                <p><strong>Total Fees:</strong> {(gasFee + adminFee).toFixed(6)} {shortName}</p>
                <p><strong>Remaining Balance:</strong> {(netBalance - parsedAmount - (gasFee + adminFee)).toFixed(6)} {shortName}</p>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.modalButton}
                  onClick={confirmSend}
                  disabled={sending}
                >
                  {sending ? "Confirming..." : "Confirm"}
                </button>
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

        {/* ✅ Success Modal */}
        {showSuccess && transactionHash && (
          <SuccessModal
            message="✅ Transaction Successful!"
            onClose={() => setShowSuccess(false)}
            transactionHash={transactionHash}
            network={activeNetwork}
          />
        )}

        {/* ✅ Error Modal */}
        {error && (
          <ErrorModal
            error={error}
            onClose={handleRetry}
          />
        )}
      </div>
    </main>
  );
        }
