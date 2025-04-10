"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePageReady } from "@/hooks/usePageReady";
import { useSwipeReady } from "@/hooks/useSwipeReady";
import { usePrices } from "@/hooks/usePrices";
import { useDebounce } from "@/hooks/useDebounce";
import { useTotalFeeCalculator } from "@/hooks/useTotalFeeCalculator";

import SwipeSelector from "@/components/SwipeSelector";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SuccessModal from "@/components/modals/SuccessModal";
import ErrorModal from "@/components/modals/ErrorModal";
import SuccessToast from "@/components/SuccessToast";

import { sendTransaction } from "@/utils/sendCryptoFunction";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

// ✅ Tinklai
const networkOptions = [
  { key: "ethereum", label: "Ethereum" },
  { key: "bsc", label: "BNB" },
  { key: "tbnb", label: "Testnet BNB" },
  { key: "polygon", label: "Polygon" },
  { key: "avalanche", label: "Avalanche" },
];

// ✅ Trumpi pavadinimai
const networkShortNames = {
  ethereum: "ETH",
  bsc: "BNB",
  tbnb: "tBNB",
  polygon: "MATIC",
  avalanche: "AVAX",
};

// ✅ Mygtukų spalvos
const buttonColors = {
  ethereum: "#0072ff",
  bsc: "#f0b90b",
  tbnb: "#f0b90b",
  polygon: "#8247e5",
  avalanche: "#e84142",
};

// ✅ Minimalios sumos
const minAmounts = {
  ethereum: 0.001,
  bsc: 0.0005,
  tbnb: 0.0005,
  polygon: 0.1,
  avalanche: 0.01,
};

export default function SendPage() {
  const { user } = useAuth();
  const { balances, initialLoading } = useBalance();
  const { prices } = usePrices();
  const isReady = usePageReady();
  const swipeReady = useSwipeReady();
  const router = useRouter();

  const [network, setNetwork] = useState("bsc");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [error, setError] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);

  const shortName = useMemo(() => networkShortNames[network] || network.toUpperCase(), [network]);
  const parsedAmount = useMemo(() => Number(amount) || 0, [amount]);
  const debouncedAmount = useDebounce(parsedAmount, 400);

  const { gasFee, adminFee, totalFee, loading: feeLoading, error: feeError } = useTotalFeeCalculator(network, debouncedAmount);

  const netBalance = useMemo(() => balances?.[network]?.balance ? parseFloat(balances[network].balance) : 0, [balances, network]);

  const usdValue = useMemo(() => {
    const price = prices?.[network]?.usd || 0;
    return (netBalance * price).toFixed(2);
  }, [netBalance, prices, network]);

  const eurValue = useMemo(() => {
    const price = prices?.[network]?.eur || 0;
    return (netBalance * price).toFixed(2);
  }, [netBalance, prices, network]);

  const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const handleNetworkChange = useCallback((selectedNetwork) => {
    if (!selectedNetwork) return;
    setNetwork(selectedNetwork);
    setAmount("");
    setReceiver("");
    setToastMessage(`Switched to ${networkShortNames[selectedNetwork] || selectedNetwork.toUpperCase()}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  }, []);

  const handleSend = () => {
    if (!isValidAddress(receiver)) {
      alert("❌ Invalid wallet address.");
      return;
    }
    if (parsedAmount < minAmounts[network]) {
      alert(`❌ Minimum to send is ${minAmounts[network]} ${shortName}`);
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
    setSending(true);
    setError(null);

    try {
      if (typeof window !== "undefined" && user?.email) {
        const hash = await sendTransaction({
          to: receiver.trim().toLowerCase(),
          amount: parsedAmount,
          network,
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
    } finally {
      setSending(false);
    }
  };

  const handleRetry = () => setError(null);

  if (!isReady || !swipeReady || initialLoading) {
    return (
      <div style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "transparent",
      }}>
        <MiniLoadingSpinner />
      </div>
    );
  }

  const sendButtonStyle = {
    backgroundColor: buttonColors[network] || "#ffffff",
    color: network === "bsc" || network === "tbnb" ? "#000000" : "#ffffff",
    border: "2px solid white",
    width: "100%",
    padding: "12px",
    fontSize: "18px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.3s ease",
    marginTop: "16px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
  };

  return (
    <main className={`${styles.main} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <SuccessToast show={showToast} message={toastMessage} networkKey={network} />

        <SwipeSelector options={networkOptions} selected={network} onSelect={handleNetworkChange} />

        <div className={styles.balanceTable}>
          <p className={styles.whiteText}>
            Your Balance: <span className={styles.balanceAmount}>{netBalance.toFixed(6)} {shortName}</span>
          </p>
          <p className={styles.whiteText}>
            ≈ €{eurValue} | ${usdValue}
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
                  Minimum to send: {minAmounts[network]} {shortName}
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
              router.push("/app/dashboard"); // ✅ Po success grįžtam į dashboard
            }}
            transactionHash={transactionHash}
            network={network}
          />
        )}

        {error && (
          <ErrorModal
            error={error}
            onRetry={handleRetry}
          />
        )}
      </div>
    </main>
  );
        }
