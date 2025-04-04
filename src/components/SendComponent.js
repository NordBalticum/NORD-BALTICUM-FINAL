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
      setStatus("❌ Please fill all fields.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(receiver.trim())) {
      setStatus("❌ Invalid wallet address.");
      return;
    }

    if (parseFloat(amount) <= 0) {
      setStatus("❌ Amount must be greater than 0.");
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
        setStatus(`✅ Success! TxHash: ${result.txHash}`);
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
    return <div style={styles.loading}>Loading wallet...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>SEND {activeNetwork?.toUpperCase()}</h2>

      <form onSubmit={handleSend} style={styles.form}>
        <input
          type="text"
          placeholder="Receiver Address"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          required
          style={styles.input}
        />

        <input
          type="number"
          step="0.0001"
          placeholder="Amount"
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
            backgroundColor: sending ? "#999" : "#0070f3",
          }}
        >
          {sending ? "Sending..." : "Send Now"}
        </button>
      </form>

      {status && (
        <p style={{
          marginTop: "20px",
          fontWeight: "bold",
          color: status.startsWith("✅") ? "green" : "red",
          fontSize: "16px",
        }}>
          {status}
        </p>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    textAlign: "center",
    color: "white",
  },
  title: {
    fontSize: "24px",
    marginBottom: "20px",
    textTransform: "uppercase",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    maxWidth: "400px",
    margin: "0 auto",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    color: "white",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "16px",
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    fontSize: "18px",
    color: "white",
  },
};
