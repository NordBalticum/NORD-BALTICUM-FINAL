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
    if (!wallet?.private_key || !isValidAddress(recipient) || !amount) {
      setStatus("Invalid address or amount");
      return;
    }

    setSending(true);
    setStatus("Sending...");

    try {
      const txHash = await sendBNB(wallet.private_key, recipient, amount, selectedNetwork);
      setStatus(`✅ Sent! Tx: ${txHash.slice(0, 10)}...`);

      refreshBalance();
      setRecipient("");
      setAmount("");
    } catch (error) {
      console.error("❌ Send failed:", error);
      setStatus("❌ Error sending");
    } finally {
      setSending(false);
    }
  };

  if (!user || !wallet) {
    return (
      <div className={styles.loading} role="status">
        Loading...
      </div>
    );
  }

  return (
    <div className="fullscreenContainer" role="main">
      <Navbar />
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Send BNB</h1>

        <div className={styles.card}>
          <p><strong>From:</strong> {wallet.address}</p>
          <p><strong>Balance:</strong> {balance} BNB</p>

          <input
            type="text"
            placeholder="Recipient address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount (BNB)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <button
            className={styles.sendButton}
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? "Sending..." : "✅ Send"}
          </button>

          {status && <p className={styles.status}>{status}</p>}
        </div>
      </div>
    </div>
  );
}
