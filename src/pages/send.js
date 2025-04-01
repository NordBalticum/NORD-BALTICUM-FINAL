"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useSendTransaction } from "@/hooks/useSendTransaction";
import { useBalance } from "@/hooks/useBalance";
import { getWalletBalance, isValidAddress } from "@/lib/ethers";
import { supportedNetworks } from "@/utils/networks";
import { fetchPrices } from "@/utils/fetchPrices";

import SwipeSelector from "@/components/SwipeSelector";
import StarsBackground from "@/components/StarsBackground";
import SuccessModal from "@/components/modals/SuccessModal";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export default function Send() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const { send, loading, error, success } = useSendTransaction();
  const { refresh: refreshBalance } = useBalance();

  const [selected, setSelected] = useState(0);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0.00000");
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
      const price = prices[selectedNet.symbol] || 0;
      const eur = (parseFloat(formatted) * price).toFixed(2);
      setBalanceEUR(eur);
    } catch (err) {
      console.warn("❌ Balance fetch failed:", err.message);
      setBalance("0.00000");
      setBalanceEUR("0.00");
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

    if (Number(amount) <= 0 || Number(amount) > Number(balance)) {
      return alert("❌ Insufficient balance or invalid amount.");
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
      adminWallet: ADMIN_WALLET,
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
        <p className={styles.subtext}>Choose your network and enter details</p>

        <SwipeSelector
          mode="send"
          onSelect={(symbol) => {
            const index = supportedNetworks.findIndex(
              (n) => n.symbol.toLowerCase() === symbol.toLowerCase()
            );
            if (index !== -1) setSelected(index);
          }}
        />

        <div className={styles.balanceInfo}>
          <p>
            Balance: <strong>{balance}</strong> {selectedNet.symbol} (~€ {balanceEUR})
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
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
            autoComplete="off"
          />
          <p className={styles.feeBreakdown}>
            Recipient will get <strong>{amountAfterFee.toFixed(6)} {selectedNet.symbol}</strong>
            {" "} | <span title="3% admin fee will be deducted.">Includes 3% fee</span>
          </p>
          {error && <p className={styles.error}>❌ {error}</p>}
          <button
            onClick={handleSend}
            className={styles.confirmButton}
            disabled={loading}
          >
            {loading ? "SENDING..." : "SEND"}
          </button>
        </div>

        {showConfirm && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <div className={styles.modalTitle}>Confirm Transaction</div>
              <div className={styles.modalInfo}>
                <p><strong>Network:</strong> {selectedNet.name}</p>
                <p><strong>To:</strong> {receiver}</p>
                <p><strong>Amount:</strong> {amount} {selectedNet.symbol}</p>
                <p><strong>Recipient gets:</strong> {amountAfterFee.toFixed(6)} {selectedNet.symbol}</p>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.modalButton} onClick={confirmSend}>
                  Confirm
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

        {success && (
          <SuccessModal
            message="Transaction Sent Successfully!"
            txHash={success.userTx}
            networkKey={networkKey}
            onClose={() => setShowSuccess(false)}
          />
        )}
      </div>
    </main>
  );
}
