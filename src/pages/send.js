"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useSendTransaction } from "@/hooks/useSendTransaction";
import { useBalance } from "@/hooks/useBalance";
import {
  getWalletBalance,
  getMaxSendableAmount,
  isValidAddress,
} from "@/lib/ethers";
import { supportedNetworks } from "@/utils/networks";
import { fetchPrices } from "@/utils/fetchPrices";
import SwipeSelector from "@/components/SwipeSelector";
import StarsBackground from "@/components/StarsBackground";
import SuccessModal from "@/components/modals/SuccessModal";
import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

export default function Send() {
  const router = useRouter();
  const { user, wallet, getPrivateKey } = useMagicLink();
  const { send, loading, error, success } = useSendTransaction();
  const { refresh: refreshBalance } = useBalance();

  const [selected, setSelected] = useState(0);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0.00000");
  const [maxSendable, setMaxSendable] = useState("0.00000");
  const [balanceEUR, setBalanceEUR] = useState("0.00");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedNet = supportedNetworks[selected];
  const networkKey = selectedNet.symbol.toLowerCase();
  const calculatedFee = Number(amount || 0) * 0.03;
  const amountAfterFee = Number(amount || 0) - calculatedFee;

  useEffect(() => {
    if (!user || !wallet?.address) router.push("/");
  }, [user, wallet, router]);

  const loadBalance = async () => {
    try {
      const currentAddress =
        wallet?.list?.find((w) => w.network.toLowerCase() === networkKey)?.address ||
        wallet?.address;

      if (!currentAddress) throw new Error("Address not found");

      const { formatted } = await getWalletBalance(currentAddress, networkKey);
      setBalance(formatted);

      const prices = await fetchPrices();
      const price = prices[selectedNet.symbol.toUpperCase()] || 0;
      const eur = (parseFloat(formatted) * price).toFixed(2);
      setBalanceEUR(eur);

      const max = await getMaxSendableAmount(getPrivateKey(), networkKey);
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
  }, [selected, wallet]);

  const handleSend = () => {
    const trimmedAddress = receiver.trim();

    if (!trimmedAddress || !amount || isNaN(amount)) {
      return alert("❌ Please enter a valid address and amount.");
    }

    if (!isValidAddress(trimmedAddress)) {
      return alert("❌ Invalid wallet address.");
    }

    if (Number(amount) <= 0 || Number(amount) > Number(maxSendable)) {
      return alert(`❌ Max you can send (incl. fee): ${maxSendable}`);
    }

    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    const trimmedAddress = receiver.trim();

    const result = await send({
      to: trimmedAddress,
      amount,
      symbol: selectedNet.symbol,
      metadata: { type: "send" },
    });

    if (result) {
      setReceiver("");
      setAmount("");
      await new Promise((r) => setTimeout(r, 1500));
      await loadBalance();
      await refreshBalance();
      setShowSuccess(true);
    }
  };

  if (!user || !wallet?.address) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <main className={`${styles.main} ${background.gradient}`}>
      <StarsBackground />
      <div className={styles.wrapper}>
        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Transfer your crypto securely & instantly</p>

        <SwipeSelector
          mode="send"
          onSelect={(symbol) => {
            const index = supportedNetworks.findIndex(
              (n) => n.symbol.toLowerCase() === symbol.toLowerCase()
            );
            if (index !== -1) setSelected(index);
          }}
        />

        <div className={styles.balanceTable}>
          <p className={styles.whiteText}>
            Total Balance: <strong>{balance}</strong> {selectedNet.symbol} (~€ {balanceEUR})
          </p>
          <p className={styles.whiteText}>
            Max Sendable: <strong>{maxSendable}</strong> {selectedNet.symbol} (incl. gas + 3% fee)
          </p>
        </div>

        <div className={styles.walletActions}>
          <input
            type="text"
            placeholder="Receiver address"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className={styles.inputField}
            autoComplete="off"
          />
          <input
            type="number"
            placeholder="Amount to send"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
            autoComplete="off"
          />
          <p className={styles.feeBreakdown}>
            Recipient receives <strong>{amountAfterFee.toFixed(6)} {selectedNet.symbol}</strong>
            <br />Includes 3% fee & gas reserved.
          </p>
          {error && <p className={styles.error}>❌ {error}</p>}
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
                <p><strong>Network:</strong> {selectedNet.name}</p>
                <p><strong>To:</strong> {receiver}</p>
                <p><strong>Send:</strong> {amount} {selectedNet.symbol}</p>
                <p><strong>Gets:</strong> {amountAfterFee.toFixed(6)} {selectedNet.symbol}</p>
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
            txHash={success.userTx}
            networkKey={networkKey}
            onClose={() => setShowSuccess(false)}
          />
        )}
      </div>
    </main>
  );
}
