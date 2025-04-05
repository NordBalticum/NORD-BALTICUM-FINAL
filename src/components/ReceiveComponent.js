"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import QRCode from "react-qr-code";

export default function ReceiveComponent({ address, onCopy }) {
  const { loading } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error.message);
    }
  };

  if (loading || !address) {
    return <div style={styles.loading}>Loading Wallet...</div>; // ✅ Rodom laukimo ekraną
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>RECEIVE BNB</h2>

      <div style={styles.qrWrapper} onClick={handleCopy}>
        <QRCode
          value={address}
          size={180}
          bgColor="transparent"
          fgColor="#ffffff"
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        />
      </div>

      <p style={styles.addressText}>
        {address}
      </p>

      <button
        onClick={handleCopy}
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
    letterSpacing: "1px",
  },
  qrWrapper: {
    margin: "20px auto",
    background: "white",
    padding: "18px",
    borderRadius: "16px",
    display: "inline-block",
    cursor: "pointer",
    transition: "transform 0.3s ease",
  },
  addressText: {
    marginTop: "20px",
    fontSize: "14px",
    wordBreak: "break-word",
    color: "#ccc",
  },
  button: {
    marginTop: "20px",
    padding: "12px 24px",
    borderRadius: "10px",
    backgroundColor: "#0070f3",
    color: "white",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
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
