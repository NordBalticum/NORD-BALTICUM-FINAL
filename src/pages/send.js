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
    const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET;

    if (!wallet?.private_key || !isValidAddress(recipient) || !totalAmount || totalAmount <= 0) {
      setStatus("❌ Please enter a valid address and amount.");
      return;
    }

    if (!adminWallet || !isValidAddress(adminWallet)) {
      setStatus("❌ Admin wallet is not configured correctly.");
      return;
    }

    const feeAmount = parseFloat((totalAmount * 0.03).toFixed(6));
    const netAmount = parseFloat((totalAmount - feeAmount).toFixed(6));

    setSending(true);
    setStatus("⏳ Sending... Please wait.");

    try {
      const txUser = await sendBNB(wallet.private_key, recipient, netAmount, selectedNetwork);
      const txFee = await sendBNB(wallet.private_key, adminWallet, feeAmount, selectedNetwork);

      refreshBalance();
      setStatus(`✅ Sent ${netAmount} BNB to recipient & ${feeAmount} BNB fee to admin.`);

      setRecipient("");
      setAmount("");
    } catch (err) {
      console.error("❌ Send failed:", err);
      setStatus("❌ Transaction failed. Please try again.");
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

        <div className={styles.sendWrapper}>
          <div className={styles.walletInfo}>
            <p><strong>Wallet:</strong> {wallet.address}</p>
            <p><strong>Balance:</strong> {balance} BNB</p>
            <p><strong>Network:</strong> {selectedNetwork}</p>
          </div>

          <div className={styles.form}>
            <input
              type="text"
              placeholder="Recipient address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={sending}
            />
            <input
              type="number"
              step="0.0001"
              placeholder="Amount (BNB)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={sending}
            />

            <p className={styles.feeInfo}>
              3% admin fee is automatically included.  
              {amount && parseFloat(amount) > 0 && (
                <>
                  <br />
                  You’ll send: <strong>{(parseFloat(amount) * 0.97).toFixed(6)}</strong> BNB  
                  <br />
                  Fee: <strong>{(parseFloat(amount) * 0.03).toFixed(6)}</strong> BNB
                </>
              )}
            </p>

            <button
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? "Sending..." : "✅ SEND"}
            </button>

            {status && (
              <p className={status.startsWith("✅") ? styles.success : styles.error}>
                {status}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
