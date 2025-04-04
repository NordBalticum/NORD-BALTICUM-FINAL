"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const SendComponent = () => {
  const { sendTransaction, activeNetwork, loading } = useAuth();
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!receiver || !amount) {
      setStatus("❌ Please fill all fields.");
      return;
    }

    setSending(true);
    try {
      const result = await sendTransaction({
        receiver,
        amount,
        network: activeNetwork,
      });

      if (result.success) {
        setStatus(`✅ Success! TxHash: ${result.txHash}`);
      } else {
        setStatus(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      setStatus(`❌ Unexpected error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div>Loading wallet...</div>;
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Send {activeNetwork.toUpperCase()}</h2>
      <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px", margin: "0 auto" }}>
        <input
          type="text"
          placeholder="Receiver address"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <input
          type="number"
          step="0.0001"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        />
        <button
          type="submit"
          disabled={sending}
          style={{
            padding: "10px",
            borderRadius: "8px",
            backgroundColor: sending ? "#999" : "#0070f3",
            color: "white",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
          }}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>

      {status && (
        <p style={{ marginTop: "20px", fontWeight: "bold", color: status.startsWith("✅") ? "green" : "red" }}>
          {status}
        </p>
      )}
    </div>
  );
};

export default SendComponent;
