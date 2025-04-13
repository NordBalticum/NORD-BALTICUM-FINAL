"use client";

// 1️⃣ IMPORTAI
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSend } from "@/contexts/SendContext";
import { useBalances } from "@/contexts/BalanceContext";

import { usePageReady } from "@/hooks/usePageReady";
import { useSwipeReady } from "@/hooks/useSwipeReady";
import { useDebounce } from "@/hooks/useDebounce";

import SwipeSelector from "@/components/SwipeSelector";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SuccessModal from "@/components/modals/SuccessModal";
import ErrorModal from "@/components/modals/ErrorModal";
import SuccessToast from "@/components/SuccessToast";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

// 2️⃣ NETWORK KONFIGŪRACIJA
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

// 3️⃣ PAGRINDINIS KOMPONENTAS
export default function SendPage() {
  const { user, authLoading, walletLoading } = useAuth();
  const { activeNetwork, setActiveNetwork } = useNetwork();
  const { sendTransaction, sending, gasFee, adminFee, totalFee, feeLoading, feeError } = useSend();
  const { balances, getUsdBalance, getEurBalance } = useBalances();

  const isReady = usePageReady();
  const swipeReady = useSwipeReady();
  const router = useRouter();

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
  const debouncedAmount = useDebounce(parsedAmount, 400);

  const netBalance = useMemo(() => balances?.[activeNetwork] || 0, [balances, activeNetwork]);
  const balanceEur = getEurBalance(activeNetwork);
  const balanceUsd = getUsdBalance(activeNetwork);

  const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const handleNetworkChange = (selectedNetwork) => {
    if (!selectedNetwork) return;
    setActiveNetwork(selectedNetwork);
    setAmount("");
    setReceiver("");
    setToastMessage(`Switched to ${networkShortNames[selectedNetwork] || selectedNetwork.toUpperCase()}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  };

  const handleSend = () => {
    if (!isValidAddress(receiver)) {
      alert("❌ Invalid wallet address.");
      return;
    }
    if (parsedAmount < minAmounts[activeNetwork]) {
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
        const hash = await sendTransaction({
          to: receiver.trim().toLowerCase(),
          amount: parsedAmount,
          network: activeNetwork,
          userEmail: user.email,
        });

        setTransactionHash(hash);
        setReceiver("");
        setAmount("");
        setShowSuccess(true);
      }
    } catch (err) {
      console.error("❌ Transaction error:", err?.message || err);
      setError(err?.message || "Transaction failed.");
    }
  };

  const handleRetry = () => setError(null);

  useEffect(() => {
    if (!user && isReady) {
      router.replace("/");
    }
  }, [user, isReady, router]);

  if (!isReady || !swipeReady || authLoading || walletLoading) {
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

        <SwipeSelector selected={activeNetwork} onSelect={handleNetworkChange} />

        <div className={styles.balanceTable}>
          <p className={styles.whiteText}>
            Your Balance: <span className={styles.balanceAmount}>{netBalance.toFixed(6)} {shortName}</span>
          </p>
          <p className={styles.whiteText}>
            ≈ €{balanceEur} | ≈ ${balanceUsd}
          </p>
        </div>

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

          <button
            onClick={handleSend}
            disabled={sending || feeLoading}
            style={sendButtonStyle}
          >
            {sending ? (
              <MiniLoadingSpinner size={20} color="#fff" />
            ) : (
              "SEND NOW"
            )}
          </button>
        </div>

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

        {showSuccess && transactionHash && (
          <SuccessModal
            message="✅ Transaction Successful!"
            onClose={() => {
              setShowSuccess(false);
            }}
            transactionHash={transactionHash}
            network={activeNetwork}
          />
        )}

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
