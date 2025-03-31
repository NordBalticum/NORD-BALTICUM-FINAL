"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { sendTransactionWithFee, isValidAddress } from "@/lib/ethers";
import { supportedNetworks } from "@/utils/networks";
import { supabase } from "@/lib/supabase";

import SwipeSelector from "@/components/SwipeSelector";
import StarsBackground from "@/components/StarsBackground";
import SuccessModal from "@/components/modals/SuccessModal";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export default function Send() {
  const router = useRouter();
  const { user, wallet, getPrivateKey } = useMagicLink();

  const [selected, setSelected] = useState(0);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedNet = supportedNetworks[selected];
  const calculatedFee = Number(amount || 0) * 0.03;
  const amountAfterFee = Number(amount || 0) - calculatedFee;

  useEffect(() => {
    if (!user || !wallet?.address) router.push("/");
  }, [user, wallet]);

  const handleSend = () => {
    if (!receiver || !amount || isNaN(amount)) {
      alert("Please enter a valid address and amount.");
      return;
    }
    if (!isValidAddress(receiver)) {
      alert("Invalid wallet address.");
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      const privateKey = getPrivateKey();
      if (!privateKey) throw new Error("Private key not found");

      const result = await sendTransactionWithFee({
        privateKey,
        to: receiver,
        amount,
        symbol: selectedNet.symbol,
        adminWallet: ADMIN_WALLET,
      });

      await supabase.from("transactions").insert([
        {
          sender_email: user.email,
          receiver,
          amount: Number(result.sent),
          fee: Number(result.fee),
          network: selectedNet.symbol,
          type: "send",
          tx_hash: result.userTx,
          status: "success",
          created_at: new Date().toISOString(),
        },
      ]);

      setShowSuccess(true);
      setReceiver("");
      setAmount("");
    } catch (err) {
      console.error("❌ Send failed:", err.message);
      alert("Transaction failed. Please try again.");
    } finally {
      setLoading(false);
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
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
          />
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

        {showSuccess && (
          <SuccessModal
            message="Transaction Sent Successfully!"
            onClose={() => setShowSuccess(false)}
          />
        )}
      </div>
    </main>
  );
}
