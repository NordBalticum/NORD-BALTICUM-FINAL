"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";

import SwipeSelector from "@/components/SwipeSelector";
import StarsBackground from "@/components/StarsBackground";
import SuccessModal from "@/components/modals/SuccessModal";

import { supportedNetworks } from "@/utils/networks";
import { sendTransactionWithFee, getWalletBalance } from "@/lib/ethers";
import { supabase } from "@/lib/supabase";

import Image from "next/image";
import styles from "@/styles/send.module.css";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

export default function Send2() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { wallet } = useWallet();

  const [selected, setSelected] = useState(0);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !wallet?.address) router.push("/");
  }, [user, wallet]);

  const handleSend = () => {
    if (!receiver || !amount) {
      alert("Please enter both the address and amount.");
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    setLoading(true);
    const selectedNet = supportedNetworks[selected];

    try {
      const result = await sendTransactionWithFee({
        privateKey: wallet.privateKey,
        to: receiver,
        amount,
        symbol: selectedNet.symbol,
        adminWallet: ADMIN_WALLET,
      });

      const updatedBalance = await getWalletBalance(
        wallet.address,
        selectedNet.key || selectedNet.symbol.toLowerCase()
      );
      wallet.balance = updatedBalance.formatted;

      await supabase.from("transactions").insert([
        {
          sender_email: user.email,
          receiver: receiver,
          amount: Number(result.sent),
          fee: Number(result.fee),
          network: selectedNet.symbol,
          type: "send",
          tx_hash: result.userTx,
          status: "success",
          created_at: new Date().toISOString(),
        },
      ]);

      setTimeout(() => {
        setShowSuccess(true);
        setReceiver("");
        setAmount("");
        setLoading(false);
      }, 1500);
    } catch (err) {
      console.error("❌ Transaction Error:", err);
      alert("Transaction failed. Please check your wallet and try again.");
      setLoading(false);
    }
  };

  const selectedNet = supportedNetworks[selected];
  const calculatedFee = Number(amount || 0) * 0.03;
  const amountAfterFee = Number(amount || 0) - calculatedFee;

  if (!user || !wallet?.address) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <main className={styles.main}>
      <StarsBackground />

      <div className={styles.wrapper}>
        <Image src="/icons/logo.svg" width={64} height={64} alt="Logo" className={styles.logoTop} />

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
          <button onClick={handleSend} className={styles.confirmButton} disabled={loading}>
            {loading ? "SENDING..." : "SEND"}
          </button>
        </div>

        {showConfirm && (
          <div className={styles.confirmModal}>
            <div className={styles.modalTitle}>Confirm Transaction</div>
            <div className={styles.modalInfo}>
              <p><strong>Network:</strong> {selectedNet.name}</p>
              <p><strong>To:</strong> {receiver}</p>
              <p><strong>Amount:</strong> {amount} {selectedNet.symbol}</p>
              <p><strong>Recipient gets:</strong> {amountAfterFee.toFixed(6)} {selectedNet.symbol}</p>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalButton} onClick={confirmSend}>Confirm</button>
              <button className={`${styles.modalButton} ${styles.cancel}`} onClick={() => setShowConfirm(false)}>Cancel</button>
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
