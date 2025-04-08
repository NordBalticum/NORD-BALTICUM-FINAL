"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePageReady } from "@/hooks/usePageReady";
import { useFeeCalculator } from "@/hooks/useFeeCalculator";
import { usePrices } from "@/hooks/usePrices";

import SwipeSelector from "@/components/SwipeSelector";
import LoadingSpinner from "@/components/LoadingSpinner";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SuccessModal from "@/components/modals/SuccessModal";
import ErrorModal from "@/components/modals/ErrorModal";
import SuccessToast from "@/components/SuccessToast";

import { supabase } from "@/utils/supabaseClient";
import { getEstimatedGasFee } from "@/utils/getEstimatedGasFee";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

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
  const isReady = usePageReady();
  const { user } = useAuth();
  const { balances, loading: balancesLoading, initialLoading, refetch } = useBalance();
  const { prices } = usePrices();

  const [network, setNetwork] = useState("bsc");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  const [gasOption, setGasOption] = useState("average");

  const [estimatedFee, setEstimatedFee] = useState(null);
  const [estimatedFeeLoading, setEstimatedFeeLoading] = useState(false);
  const [estimatedFeeError, setEstimatedFeeError] = useState(false);

  const { gasFee: fallbackFee, loading: fallbackFeeLoading, refetchFees } = useFeeCalculator(network);

  const shortName = useMemo(() => networkShortNames[network] || network.toUpperCase(), [network]);
  const parsedAmount = useMemo(() => Number(amount) || 0, [amount]);
  const netBalance = useMemo(() => balances?.[network]?.balance ? parseFloat(balances[network].balance) : 0, [balances, network]);

  const adminFee = useMemo(() => parsedAmount > 0 ? parsedAmount * 0.03 : 0, [parsedAmount]);

  const usdBalance = useMemo(() => {
    const price = prices?.[network]?.usd || 0;
    return price ? (netBalance * price).toFixed(2) : "0.00";
  }, [netBalance, prices, network]);

  const eurBalance = useMemo(() => {
    const price = prices?.[network]?.eur || 0;
    return price ? (netBalance * price).toFixed(2) : "0.00";
  }, [netBalance, prices, network]);

  const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const handleNetworkChange = useCallback(async (selectedNetwork) => {
    if (!selectedNetwork) return;
    setNetwork(selectedNetwork);
    await refetch();
    await refetchFees();
    setAmount("");
    setToastMessage(`Switched to ${networkShortNames[selectedNetwork] || selectedNetwork.toUpperCase()}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  }, [refetch, refetchFees]);

  const handleSend = () => {
    if (!isValidAddress(receiver)) {
      alert("❌ Invalid wallet address.");
      return;
    }
    if (parsedAmount <= 0) {
      alert("❌ Enter a valid amount.");
      return;
    }
    if (parsedAmount + adminFee > netBalance) {
      alert(`❌ Insufficient balance. Required: ${(parsedAmount + adminFee).toFixed(6)} ${shortName}`);
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

        console.log("✅ Transaction successful, hash:", hash);
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
        await refetch();
        setShowSuccess(true);
      }
    } catch (err) {
      console.error("❌ Transaction error:", err.message || err);
      setError(err.message || "Transaction failed.");
    } finally {
      setSending(false);
    }
  };

  const handleRetry = () => setError(null);

  const finalFee = useMemo(() => estimatedFeeError ? fallbackFee : estimatedFee, [estimatedFeeError, fallbackFee, estimatedFee]);

  useEffect(() => {
    async function fetchGasFee() {
      if (!network || !gasOption) return;
      try {
        setEstimatedFeeLoading(true);
        const fee = await getEstimatedGasFee(network, gasOption);
        setEstimatedFee(fee);
        setEstimatedFeeError(false);
      } catch (error) {
        console.error("Failed to fetch gas fee:", error.message);
        setEstimatedFeeError(true);
      } finally {
        setEstimatedFeeLoading(false);
      }
    }
    fetchGasFee();

    const gasFeeInterval = setInterval(fetchGasFee, 30000); // 30s refresh
    return () => clearInterval(gasFeeInterval);
  }, [network, gasOption]);

  useEffect(() => {
    const balanceInterval = setInterval(() => {
      refetch();
    }, 30000); // 30s refresh
    return () => clearInterval(balanceInterval);
  }, [refetch]);

  if (!isReady || initialLoading || balancesLoading) {
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

        <SwipeSelector onSelect={handleNetworkChange} />

        <div className={styles.balanceTable}>
          <p className={styles.whiteText}>
            Your Balance:&nbsp;
            <span className={styles.balanceAmount}>
              {netBalance.toFixed(6)} {shortName}
            </span>
          </p>
          <p className={styles.whiteText}>
            ≈ €{eurBalance} | ${usdBalance}
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

          <p className={styles.feeBreakdown}>
            Admin Fee: <strong>{adminFee.toFixed(6)} {shortName}</strong><br />
            Gas Fee (Est.):&nbsp;
            {estimatedFeeLoading ? (
              <span>Loading...</span>
            ) : (
              <strong>{finalFee?.toFixed(6)} {shortName}</strong>
            )}
          </p>

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

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <div className={styles.modalTitle}>Confirm Transaction</div>
              <div className={styles.modalInfo}>
                <p><strong>Network:</strong> {shortName}</p>
                <p><strong>Receiver:</strong> {receiver}</p>
                <p><strong>Amount:</strong> {parsedAmount.toFixed(6)} {shortName}</p>
                <p><strong>Admin Fee:</strong> {adminFee.toFixed(6)} {shortName}</p>
                <p><strong>Estimated Gas Fee:</strong> {estimatedFeeLoading ? "Loading..." : finalFee ? `${finalFee.toFixed(6)} ${shortName}` : "Error"}</p>
                <p><strong>Total Deducted:</strong> {(parsedAmount + adminFee + (finalFee || 0)).toFixed(6)} {shortName}</p>
                <p><strong>Remaining Balance:</strong> {(netBalance - parsedAmount - adminFee - (finalFee || 0)).toFixed(6)} {shortName}</p>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.modalButton} onClick={confirmSend} disabled={sending}>
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

        {/* Success & Error Modals */}
        {showSuccess && (
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
