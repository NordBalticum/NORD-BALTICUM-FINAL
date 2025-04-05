"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { useSendCrypto } from "@/hooks/useSendCrypto";
import { usePageReady } from "@/hooks/usePageReady";
import { useFeeCalculator } from "@/hooks/useFeeCalculator";
import { usePrices } from "@/hooks/usePrices"; // ✅ Pridėta EUR/USD konvertavimui

import SwipeSelector from "@/components/SwipeSelector";
import LoadingSpinner from "@/components/LoadingSpinner";
import SuccessModal from "@/components/modals/SuccessModal";
import ErrorModal from "@/components/modals/ErrorModal";
import SuccessToast from "@/components/SuccessToast";

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
  const { wallet } = useAuth();
  const { balances, loading: balancesLoading, refetch } = useBalance();
  const { sendCrypto, loading: sending, success, txHash, error, resetError } = useSendCrypto();
  const { prices } = usePrices(); // ✅ Paimam kainas

  const [network, setNetwork] = useState("bsc");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const shortName = useMemo(() => networkShortNames[network] || network.toUpperCase(), [network]);
  const parsedAmount = Number(amount) || 0;
  const netBalance = balances?.[network]?.balance ? parseFloat(balances[network].balance) : 0;

  const { gasFee, adminFee, totalFee, loading: feesLoading, refetchFees } = useFeeCalculator(network, parsedAmount);

  const afterFees = useMemo(() => {
    return parsedAmount > 0 ? parsedAmount - gasFee - adminFee : 0;
  }, [parsedAmount, gasFee, adminFee]);

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

    if (wallet?.email) {
      await refetch();
    }

    setAmount(""); // ✅ iškart resetinam amount
    setToastMessage(`Switched to ${networkShortNames[selectedNetwork] || selectedNetwork.toUpperCase()}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  }, [wallet, refetch]);

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
    try {
      await sendCrypto({
        to: receiver.trim(),
        amount: parsedAmount,
        network: network,
      });
      setReceiver("");
      setAmount("");
      setShowSuccess(true);
      await refetch();
    } catch (err) {
      console.error("❌ Transaction error:", err.message);
    }
  };

  const handleRetry = () => {
    resetError();
  };

  // ✅ Automatinis gas fee atnaujinimas kas 5 sekundes
  useEffect(() => {
    const interval = setInterval(() => {
      refetchFees();
    }, 5000);
    return () => clearInterval(interval);
  }, [network, parsedAmount, refetchFees]);

  useEffect(() => {
    if (success) {
      setShowSuccess(true);
    }
  }, [success]);

  if (!isReady || balancesLoading || feesLoading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`${styles.main} ${background.gradient}`}
    >
      <div className={styles.wrapper}>
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
          <p className={styles.subtext}>
            ≈ {eurBalance} EUR | {usdBalance} USD
          </p>
        </div>

        <div className={styles.walletActions}>
          <input
            type="text"
            placeholder="Receiver address"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className={styles.inputField}
          />
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="number"
              placeholder="Amount to send"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={styles.inputField}
            />
          </div>

          <p className={styles.feeBreakdown}>
            Gas Fee: <strong>{gasFee.toFixed(6)} {shortName}</strong><br />
            Admin Fee: <strong>{adminFee.toFixed(6)} {shortName}</strong><br />
            You Receive: <strong>{afterFees > 0 ? afterFees.toFixed(6) : "0.000000"} {shortName}</strong>
          </p>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
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
            }}
          >
            {sending ? <LoadingSpinner /> : "SEND NOW"}
          </motion.button>
        </div>

        <AnimatePresence>
          {showConfirm && (
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={styles.confirmModal}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.modalTitle}>Confirm Transaction</div>
                <div className={styles.modalInfo}>
                  <p><strong>Network:</strong> {shortName}</p>
                  <p><strong>Receiver:</strong> {receiver}</p>
                  <p><strong>Amount:</strong> {parsedAmount.toFixed(6)} {shortName}</p>
                  <p><strong>After Fees:</strong> {afterFees.toFixed(6)} {shortName}</p>
                </div>
                <div className={styles.modalActions}>
                  <button className={styles.modalButton} onClick={confirmSend}>Confirm</button>
                  <button
                    className={`${styles.modalButton} ${styles.cancel}`}
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && (
            <SuccessModal
              message="✅ Transaction Successful!"
              txHash={txHash}
              networkKey={network}
              onClose={() => setShowSuccess(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <ErrorModal
              error={error}
              onRetry={handleRetry}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
