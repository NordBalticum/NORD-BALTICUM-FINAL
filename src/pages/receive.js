"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/send.module.css";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useBalance } from "@/contexts/BalanceContext";
import { sendBNB, isValidAddress } from "@/lib/ethers";
import { useRouter } from "next/navigation";

export default function SendPage() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();
  const { selectedNetwork, setSelectedNetwork, balances, refreshBalances } = useBalance();

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !wallet) router.push("/");
  }, [user, wallet]);

  const handleSend = async () => {
    setError("");
    setStatus("");

    if (!isValidAddress(to)) return setError("Invalid address.");
    if (parseFloat(amount) <= 0) return setError("Invalid amount.");
    if (!wallet?.privateKey) return setError("Wallet not loaded.");

    try {
      setLoading(true);
      const tx = await sendBNB(wallet.privateKey, to, parseFloat(amount), selectedNetwork);
      setStatus(`✔ Sent! TX: ${tx.txHash}`);
      setTo("");
      setAmount("");
      refreshBalances();
    } catch (err) {
      console.error("❌ Send error:", err);
      setError("Transaction failed. Check logs.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !wallet) return null;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Send Crypto</h1>

      <div className={styles.card}>
        <label className={styles.label}>Select Network:</label>
        <select
          className={styles.select}
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
        >
          <option value="bsc">BSC Mainnet</option>
          <option value="bscTestnet">BSC Testnet</option>
          <option value="eth">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="avax">Avalanche</option>
        </select>

        <label className={styles.label}>Receiver Address:</label>
        <input
          type="text"
          className={styles.input}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="0x..."
        />

        <label className={styles.label}>Amount:</label>
        <input
          type="number"
          className={styles.input}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
        />

        <p className={styles.balanceText}>
          Balance: <strong>{balances[selectedNetwork]?.amount || "0.0000"}</strong>
        </p>

        {error && <p className={styles.error}>{error}</p>}
        {status && <p className={styles.success}>{status}</p>}

        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
