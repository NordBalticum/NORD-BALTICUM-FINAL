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

  const shortName = useMemo(() => networkShortNames[network] || network.toUpperCase(), [network]);
  const parsedAmount = useMemo(() => Number(amount) || 0, [amount]);
  const netBalance = useMemo(() => balances?.[network]?.balance ? parseFloat(balances[network].balance) : 0, [balances, network]);

  const { gasFee, loading: feesLoading, refetchFees } = useFeeCalculator(network);

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
    setAmount("");
    setToastMessage(`Switched to ${networkShortNames[selectedNetwork] || selectedNetwork.toUpperCase()}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  }, [refetch]);

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
      if (typeof window !== "undefined") {
        const { sendTransaction } = await import("@/utils/sendCryptoFunction");

        const hash = await sendTransaction({
          to: receiver.trim(),
          amount: parsedAmount,
          network,
          userEmail: user.email,
          gasOption,
        });

        console.log("✅ Transaction successful, hash:", hash);
        setTransactionHash(hash);

        await supabase.from("transactions").insert([{
          sender_email: user.email,
          to_address: receiver.trim(),
          amount: parsedAmount,
          fee: adminFee,
          network: network,
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

  const handleRetry = () => {
    setError(null);
  };

  useEffect(() => {
    if (amount || network) {
      refetchFees();
    }
  }, [amount, network, refetchFees]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (!isReady || initialLoading || feesLoading) {
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

        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Transfer crypto securely & instantly</p>

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
            Fees: <strong>{adminFee.toFixed(6)} {shortName}</strong>
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
            {sending ? "Sending..." : "SEND NOW"}
          </button>
        </div>

        {/* Confirm Modal */}
        {showConfirm && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              {/* Modal Content */}
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <SuccessModal
            message="✅ Transaction Successful!"
            onClose={() => setShowSuccess(false)}
            transactionHash={transactionHash}
            network={network}
          />
        )}

        {/* Error Modal */}
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
