"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceProviderEthers";
import { isValidAddress, sendBNB } from "@/lib/ethers";
import Navbar from "@/components/Navbar";
import styles from "@/styles/send.module.css";

export default function Send() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const { balance, selectedNetwork, refreshBalance } = useBalance();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const totalAmount = parseFloat(amount);
    if (!wallet?.private_key || !isValidAddress(recipient) || !totalAmount) {
      setStatus("❌ Invalid address or amount.");
      return;
    }

    const feeAmount = parseFloat((totalAmount * 0.03).toFixed(6));
    const netAmount = parseFloat((totalAmount - feeAmount).toFixed(6));
    const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET;

    if (!adminWallet || !isValidAddress(adminWallet)) {
      setStatus("❌ Admin wallet not set.");
      return;
    }

    setSending(true);
    setStatus("⏳ Sending transaction...");

    try {
      const tx1 = await sendBNB(wallet.private_key, recipient, netAmount, selectedNetwork);
      const tx2 = await sendBNB(wallet.private_key, adminWallet, feeAmount, selectedNetwork);

      refreshBalance();
      setStatus(`✅ Sent ${netAmount} BNB to recipient & ${feeAmount} fee to admin.`);

      setRecipient("");
      setAmount("");
    } catch (err) {
      console.error("❌ Send error:", err);
      setStatus("❌ Transaction failed.");
    } finally {
      setSending(false);
    }
  };

  if (!user || !wallet) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <div className="fullscreenContainer">
      <Navbar />
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Send BNB</h1>

        <div className={styles.card}>
          <div className={styles.walletInfo}>
            <p><strong>From:</strong> {wallet.address}</p>
            <p><strong>Balance:</strong> {balance} BNB</p>
            <p><strong>Network:</strong> {selectedNetwork}</p>
          </div>

          <input
            type="text"
            placeholder="Recipient address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className={styles.input}
          />
          <input
            type="number"
            step="0.0001"
            placeholder="Amount (BNB)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.input}
          />

          <p className={styles.feeInfo}>
            3% fee will be sent to admin wallet.
          </p>

          <button
            onClick={handleSend}
            className={styles.sendButton}
            disabled={sending}
          >
            {sending ? "Sending..." : "✅ SEND"}
          </button>

          {status && <p className={styles.status}>{status}</p>}
        </div>
      </div>
    </div>
  );
          }
