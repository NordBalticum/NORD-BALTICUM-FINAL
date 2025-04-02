"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useSystem } from "@/contexts/SystemContext";
import {
  getWalletBalance,
  getMaxSendableAmount,
  isValidAddress,
} from "@/lib/ethers";
import { fetchPrices } from "@/utils/fetchPrices";

import SwipeSelector from "@/components/SwipeSelector";
import SuccessModal from "@/components/modals/SuccessModal";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

const supportedNetworks = [
  { name: "BSC", symbol: "bsc" },
  { name: "Testnet", symbol: "tbnb" },
  { name: "Ethereum", symbol: "ethereum" },
  { name: "Polygon", symbol: "polygon" },
  { name: "Avalanche", symbol: "avalanche" },
];

export default function Send() {
  const router = useRouter();
  const {
    user,
    wallet,
    loading,
    activeNetwork,
    setActiveNetwork,
    sendCrypto,
    refreshAllBalances,
  } = useSystem();

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");

  const [balance, setBalance] = useState("0.00000");
  const [maxSendable, setMaxSendable] = useState("0.00000");
  const [balanceEUR, setBalanceEUR] = useState("0.00");

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");

  const calculatedFee = Number(amount || 0) * 0.03;
  const amountAfterFee = Number(amount || 0) - calculatedFee;

  useEffect(() => {
    if (!user || !wallet?.address) router.replace("/");
  }, [user, wallet]);

  const loadBalance = async () => {
    if (!wallet?.address || !wallet?.privateKey) return;
    try {
      const { formatted } = await getWalletBalance(wallet.address, activeNetwork);
      setBalance(formatted);

      const prices = await fetchPrices();
      const price = prices[activeNetwork] || 0;
      const eur = (parseFloat(formatted) * price).toFixed(2);
      setBalanceEUR(eur);

      const max = await getMaxSendableAmount(wallet.privateKey, activeNetwork);
      setMaxSendable(max);
    } catch (err) {
      console.warn("❌ Balance fetch failed:", err.message);
      setBalance("0.00000");
      setBalanceEUR("0.00");
      setMaxSendable("0.00000");
    }
  };

  useEffect(() => {
    loadBalance();
  }, [activeNetwork, wallet]);

  const handleSend = () => {
    const trimmed = receiver.trim();

    if (!trimmed || !amount || isNaN(amount)) {
      return alert("❌ Enter valid address and amount.");
    }

    if (!isValidAddress(trimmed)) {
      return alert("❌ Invalid wallet address.");
    }

    if (Number(amount) <= 0 || Number(amount) > Number(maxSendable)) {
      return alert(`❌ Max sendable (incl. fee): ${maxSendable}`);
    }

    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    const result = await sendCrypto(receiver.trim(), amount);
    if (result?.success) {
      setReceiver("");
      setAmount("");
      await loadBalance();
      await refreshAllBalances();
      setTxHash(result.hash);
      setShowSuccess(true);
    } else {
      alert(result.message || "❌ Send failed");
    }
  };

  if (!user || !wallet || loading) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <main className={`${styles.main} ${background.gradient}`}>
      <StarsBackground />

      <div className={styles.wrapper}>
        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Transfer crypto securely & instantly</p>

        <SwipeSelector
          mode="send"
          onSelect={(symbol) => setActiveNetwork(symbol)}
        />

        <div className={styles.balanceTable}>
          <p className={styles.whiteText}>
            Total Balance: <strong>{balance}</strong> {activeNetwork} (~€ {balanceEUR})
          </p>
          <p className={styles.whiteText}>
            Max Sendable: <strong>{maxSendable}</strong> {activeNetwork} (includes 3% fee)
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
          <input
            type="number"
            placeholder="Amount to send"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
          />

          <p className={styles.feeBreakdown}>
            Recipient receives <strong>{amountAfterFee.toFixed(6)} {activeNetwork}</strong>
            <br />Includes 3% fee & gas buffer.
          </p>

          <button
            onClick={handleSend}
            className={styles.confirmButton}
            disabled={loading}
          >
            {loading ? "SENDING..." : "SEND NOW"}
          </button>
        </div>

        {showConfirm && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <div className={styles.modalTitle}>Final Confirmation</div>
              <div className={styles.modalInfo}>
                <p><strong>Network:</strong> {activeNetwork}</p>
                <p><strong>To:</strong> {receiver}</p>
                <p><strong>Send:</strong> {amount}</p>
                <p><strong>Gets:</strong> {amountAfterFee.toFixed(6)} {activeNetwork}</p>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.modalButton} onClick={confirmSend}>Confirm</button>
                <button className={`${styles.modalButton} ${styles.cancel}`} onClick={() => setShowConfirm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showSuccess && (
          <SuccessModal
            message="Transaction completed!"
            txHash={txHash}
            networkKey={activeNetwork}
            onClose={() => setShowSuccess(false)}
          />
        )}
      </div>
    </main>
  );
}
