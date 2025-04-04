"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import QRCode from "react-qr-code";

const ReceiveComponent = () => {
  const { wallet, activeNetwork, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  if (loading) {
    return <div>Loading wallet...</div>;
  }

  if (!wallet?.signers?.[activeNetwork]?.address) {
    return <div>Wallet not ready...</div>;
  }

  const address = wallet.signers[activeNetwork].address;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2s notification
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Receive {activeNetwork.toUpperCase()}</h2>
      <div style={{ margin: "20px auto", background: "white", padding: "16px", borderRadius: "12px", display: "inline-block" }}>
        <QRCode value={address} size={180} />
      </div>
      <p style={{ marginTop: "20px", fontSize: "14px", wordBreak: "break-all" }}>{address}</p>
      <button
        onClick={copyToClipboard}
        style={{
          marginTop: "10px",
          padding: "10px",
          borderRadius: "8px",
          backgroundColor: copied ? "#4CAF50" : "#0070f3",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {copied ? "Copied!" : "Copy Address"}
      </button>
    </div>
  );
};

export default ReceiveComponent;
