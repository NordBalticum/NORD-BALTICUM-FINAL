"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function SendComponent() {
  const { sendTransaction, activeNetwork, loading } = useAuth();
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!receiver.trim() || !amount.trim()) {
      setStatus("❌ Please fill in all fields.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(receiver.trim())) {
      setStatus("❌ Invalid wallet address format.");
      return;
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      setStatus("❌ Amount must be a positive number.");
      return;
    }

    setSending(true);
    try {
      const result = await sendTransaction({
        receiver: receiver.trim(),
        amount: amount.trim(),
        network: activeNetwork,
      });

      if (result?.success) {
        setStatus(`✅ Transaction Successful! TxHash: ${result.txHash}`);
        setReceiver("");
        setAmount("");
      } else {
        setStatus(`❌ Error: ${result?.message || "Transaction failed."}`);
      }
    } catch (error) {
      console.error("Transaction error:", error);
      setStatus(`❌ Unexpected error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading your wallet...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Send {activeNetwork?.toUpperCase()}</h2>

      <form onSubmit={handleSend} style={styles.form}>
        <input
          type="text"
          placeholder="Receiver Address (0x...)"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          required
          style={styles.input}
        />

        <input
          type="number"
          step="0.0001"
          placeholder="Amount to Send"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={styles.input}
        />

        <button
          type="submit"
          disabled={sending}
          style={{
            ...styles.button,
            backgroundColor: sending ? "#555" : "#0070f3",
            cursor: sending ? "not-allowed" : "pointer",
          }}
        >
          {sending ? "Sending..." : "Send Now"}
        </button>
      </form>

      {status && (
        <p style={{
          marginTop: "20px",
          fontWeight: "bold",
          color: status.startsWith("✅") ? "limegreen" : "crimson",
          fontSize: "16px",
          wordBreak: "break-word",
        }}>
          {status}
        </p>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px 20px",
    textAlign: "center",
    color: "white",
  },
  title: {
    fontSize: "26px",
    marginBottom: "25px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "400px",
    margin: "0 auto",
  },
  input: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "16px",
    outline: "none",
  },
  button: {
    padding: "14px",
    borderRadius: "10px",
    fontWeight: "bold",
    color: "white",
    border: "none",
    fontSize: "16px",
    transition: "all 0.3s ease",
  },
  loading: {
    padding: "50px",
    textAlign: "center",
    fontSize: "18px",
    color: "white",
  },
};
