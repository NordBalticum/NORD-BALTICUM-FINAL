"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePageReady } from "@/hooks/usePageReady";
import { useSwipeReady } from "@/hooks/useSwipeReady";
import { usePrices } from "@/hooks/usePrices";
import { useDebounce } from "@/hooks/useDebounce";
import { useTotalFeeCalculator } from "@/hooks/useTotalFeeCalculator";

import LoadingSpinner from "@/components/LoadingSpinner";
import SwipeSelector from "@/components/SwipeSelector";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SuccessModal from "@/components/modals/SuccessModal";
import ErrorModal from "@/components/modals/ErrorModal";
import SuccessToast from "@/components/SuccessToast";

import { supabase } from "@/utils/supabaseClient";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

const networkOptions = [
  { key: "ethereum", label: "Ethereum" },
  { key: "bsc", label: "BNB" },
  { key: "tbnb", label: "Testnet BNB" },
  { key: "polygon", label: "Polygon" },
  { key: "avalanche", label: "Avalanche" },
];

const networkShortNames = {
  ethereum: "ETH",
  bsc: "BNB",
  tbnb: "tBNB",
  polygon: "MATIC",
  avalanche: "AVAX",
};

const buttonColors = {
  ethereum: "#0072ff",
  bsc: "#f0b90b",
  tbnb: "#f0b90b",
  polygon: "#8247e5",
  avalanche: "#e84142",
};

export default function SendPage() {
  const { user } = useAuth();
  const { balances, initialLoading } = useBalance();
  const { prices } = usePrices();
  const isReady = usePageReady();
  const swipeReady = useSwipeReady();

  const [network, setNetwork] = useState("bsc");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [gasOption, setGasOption] = useState("average");
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [error, setError] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);

  const shortName = useMemo(() => networkShortNames[network] || network.toUpperCase(), [network]);
  const parsedAmount = useMemo(() => Number(amount) || 0, [amount]);
  const debouncedAmount = useDebounce(parsedAmount, 500);

  const { gasFee, adminFee, totalFee, loading: feeLoading, error: feeError, refetch: refetchFees } = useTotalFeeCalculator(network, debouncedAmount, gasOption);

  const netBalance = useMemo(() => balances?.[network]?.balance ? parseFloat(balances[network].balance) : 0, [balances, network]);

  const usdValue = useMemo(() => {
  const price = prices?.[network]?.usd || 0;
  return netBalance > 0 && price ? (netBalance * price).toFixed(2) : "0.00";
}, [netBalance, prices, network]);

const eurValue = useMemo(() => {
  const price = prices?.[network]?.eur || 0;
  return netBalance > 0 && price ? (netBalance * price).toFixed(2) : "0.00";
}, [netBalance, prices, network]);

  const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const handleNetworkChange = useCallback(async (selectedNetwork) => {
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
    if (parsedAmount <= 0) {
      alert("❌ Enter a valid amount.");
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
        const { sendTransaction } = await import("@/utils/sendCryptoFunction");

        const hash = await sendTransaction({
          to: receiver.trim().toLowerCase(),
          amount: parsedAmount,
          network,
          userEmail: user.email,
          gasOption,
        });

        setTransactionHash(hash);

        await supabase.from("transactions").insert([{
          sender_email: user.email,
          to_address: receiver.trim().toLowerCase(),
          amount: parsedAmount,
          fee: adminFee,
          network,
          type: "send",
          tx_hash: hash,
        }]);

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
      <div className={styles.loading}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <main className={`${styles.main} ${background.gradient} fadeIn`}>
      <div className={`${styles.wrapper} fadeDown`}>
        
        <SuccessToast show={showToast} message={toastMessage} networkKey={network} />

        <SwipeSelector
          options={networkOptions}
          selected={network}
          onSelect={handleNetworkChange}
        />

        <div className={styles.balanceTable}>
          <p className={styles.whiteText}>
            Your Balance:&nbsp;
            <span className={styles.balanceAmount}>
              {netBalance.toFixed(6)} {shortName}
            </span>
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
          />
          <input
            type="number"
            placeholder="Amount to send"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
            disabled={sending}
          />

          <div className={styles.gasOptions}>
            <label style={{ color: "white", marginBottom: "4px" }}>Select Gas Fee:</label>
            <select
              value={gasOption}
              onChange={(e) => setGasOption(e.target.value)}
              className={styles.inputField}
              disabled={sending}
            >
              <option value="slow">Slow (Cheapest)</option>
              <option value="average">Average (Recommended)</option>
              <option value="fast">Fast (Priority)</option>
            </select>
          </div>

          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              backgroundColor: buttonColors[network] || "#0070f3",
              color: "white",
              padding: "14px",
              borderRadius: "14px",
              width: "100%",
              marginTop: "12px",
              fontWeight: "700",
              fontFamily: "var(--font-crypto)",
              border: "2px solid white",
              cursor: sending ? "not-allowed" : "pointer",
              transition: "background-color 0.4s ease",
            }}
          >
            {sending ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                Sending <MiniLoadingSpinner />
              </div>
            ) : (
              "SEND NOW"
            )}
          </button>
        </div>

        {/* Confirm Modal */}
        {showConfirm && (
  <div className={styles.overlay}>
    <div className={styles.confirmModal}>
      <div className={styles.modalTitle}>Confirm Transaction</div>
      <div className={styles.modalInfo}>
        <p><strong>Network:</strong> {shortName}</p>
        <p><strong>Receiver:</strong> {receiver}</p>
        <p><strong>Amount:</strong> {parsedAmount.toFixed(6)} {shortName}</p>

        {feeLoading ? (
          <p style={{ marginTop: "16px", color: "white" }}>
            Calculating Fees... <MiniLoadingSpinner />
          </p>
        ) : feeError ? (
          <p style={{ color: "red" }}>Failed to load fees.</p>
        ) : (
          <>
            <p><strong>Total Fees:</strong> {(gasFee + adminFee).toFixed(6)} {shortName}</p>
            <p><strong>Receiver Gets:</strong> {(parsedAmount).toFixed(6)} {shortName}</p>
            <p><strong>Remaining Balance:</strong> {(netBalance - parsedAmount - (gasFee + adminFee)).toFixed(6)} {shortName}</p>
          </>
        )}
      </div>

      <div className={styles.modalActions}>
        <button
          className={styles.modalButton}
          onClick={confirmSend}
          disabled={sending || feeLoading}
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

{showSuccess && transactionHash && network && (
  <SuccessModal
    message="✅ Transaction Successful!"
    onClose={() => setShowSuccess(false)}
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
