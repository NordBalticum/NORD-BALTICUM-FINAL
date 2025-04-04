"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import QRCode from "react-qr-code";

export default function ReceiveComponent() {
  const { wallet, activeNetwork, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  if (loading) {
    return <div style={styles.loading}>Loading wallet...</div>;
  }

  const address = wallet?.[activeNetwork];

  if (!address) {
    return <div style={styles.loading}>Wallet not ready...</div>;
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>RECEIVE {activeNetwork?.toUpperCase()}</h2>

      <div style={styles.qrWrapper} onClick={copyToClipboard}>
        <QRCode value={address} size={180} bgColor="transparent" fgColor="#ffffff" />
      </div>

      <p style={styles.addressText}>{address}</p>

      <button
        onClick={copyToClipboard}
        style={{
          ...styles.button,
          backgroundColor: copied ? "#4CAF50" : "#0070f3",
        }}
      >
        {copied ? "Copied!" : "Copy Address"}
      </button>
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
  qrWrapper: {
    margin: "20px auto",
    background: "white",
    padding: "16px",
    borderRadius: "16px",
    display: "inline-block",
    cursor: "pointer",
  },
  addressText: {
    marginTop: "20px",
    fontSize: "14px",
    wordBreak: "break-word",
  },
  button: {
    marginTop: "15px",
    padding: "12px 24px",
    borderRadius: "8px",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
    transition: "all 0.3s ease",
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    fontSize: "18px",
    color: "white",
  },
};
