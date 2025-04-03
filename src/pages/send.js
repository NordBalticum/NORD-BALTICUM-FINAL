"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useBalance } from "@/contexts/BalanceContext";

import SwipeSelector from "@/components/SwipeSelector";
import SuccessModal from "@/components/modals/SuccessModal";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

export default function Send() {
  const router = useRouter();

  const { user } = useMagicLink();
  const { sendCryptoTransaction } = useWallet();
  const { activeNetwork, setActiveNetwork } = useNetwork();
  const { balance, balanceEUR, maxSendable, refreshBalance } = useBalance();

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");

  const calculatedFee = Number(amount || 0) * 0.03;
  const amountAfterFee = Number(amount || 0) - calculatedFee;

  useEffect(() => {
    if (!user) router.replace("/");
  }, [user, router]);

  useEffect(() => {
    if (user?.email) refreshBalance(user.email, activeNetwork);
  }, [activeNetwork, user, refreshBalance]);

  const handleSend = () => {
    const trimmedReceiver = receiver.trim();

    if (!trimmedReceiver || !amount || isNaN(amount)) {
      alert("Enter a valid address and amount.");
      return;
    }

    if (Number(amount) <= 0 || Number(amount) > Number(maxSendable)) {
      alert(`Max sendable: ${maxSendable}`);
      return;
    }

    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);

    const result = await sendCryptoTransaction(
      user.email,
      activeNetwork,
      receiver.trim(),
      amount
    );

    if (result?.success) {
      setReceiver("");
      setAmount("");
      refreshBalance(user.email, activeNetwork);
      setTxHash(result.hash);
      setShowSuccess(true);
    } else {
      alert(result.message || "Transaction failed");
    }
  };

  return (
    <main className={`${styles.main} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Transfer crypto securely & instantly</p>

        <SwipeSelector mode="send" onSelect={setActiveNetwork} />

        <div className={styles.balanceTable}>
          <p className={styles.whiteText}>
            Total Balance: <strong>{balance}</strong> {activeNetwork} (~€{balanceEUR})
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
            disabled={!user}
          >
            SEND NOW
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
