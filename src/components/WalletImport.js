"use client";

import { useState } from "react";
import { Wallet } from "ethers";
import { useAuth } from "@/contexts/AuthContext";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner"; 

export default function WalletImport() {
  const { user, walletImport } = useAuth();
  const [privateKey, setPrivateKey] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidKey, setIsValidKey] = useState(false);

  // ✅ LIVE TIKRINIMAS real-time
  const handlePrivateKeyChange = (e) => {
    const value = e.target.value.trim();
    setPrivateKey(value);

    try {
      if (value.length === 66 && value.startsWith("0x")) {
        new Wallet(value);
        setIsValidKey(true);
      } else {
        setIsValidKey(false);
      }
    } catch {
      setIsValidKey(false);
    }
  };

  // ✅ PASTE iš CLIPBOARD
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPrivateKey(text.trim());
    } catch (error) {
      console.error("Failed to paste:", error.message);
    }
  };

  // ✅ IMPORTO LOGINAS
  const handleImport = async () => {
    if (!privateKey || !isValidKey) {
      setStatus("❌ Please enter a valid private key.");
      return;
    }

    try {
      setLoading(true);

      await walletImport(privateKey, user.email);

      setPrivateKey("");
      setStatus("");
      setSuccess(true);

      // ✅ Vibracija (jei supportina device)
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      setTimeout(() => {
        window.location.reload();
      }, 1800);

    } catch (err) {
      console.error("Import Wallet Error:", err.message);
      setStatus("❌ Invalid private key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "32px", width: "100%", maxWidth: "460px" }}>
      <h4 style={{ textAlign: "center", marginBottom: "12px" }}>
        Import Wallet (Private Key) <span style={{ color: "#ffd700" }}>*</span>
      </h4>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "180px" }}>
          <MiniLoadingSpinner />
        </div>
      ) : success ? (
        <div style={{
          textAlign: "center",
          padding: "24px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.2)",
          fontFamily: "var(--font-crypto)",
          color: "white",
          fontSize: "16px"
        }}>
          ✅ Wallet imported successfully! Reloading...
        </div>
      ) : (
        <>
          <input
            type="password"
            placeholder="Enter your private key"
            value={privateKey}
            onChange={handlePrivateKeyChange}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
              marginBottom: "12px",
              background: "rgba(255, 255, 255, 0.08)",
              color: isValidKey ? "#00ff99" : "white",
              fontFamily: "var(--font-crypto)",
              transition: "all 0.3s ease",
            }}
          />
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleImport}
              disabled={!isValidKey || loading}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "12px",
                background: isValidKey ? "black" : "#555",
                color: "white",
                border: "1px solid white",
                fontWeight: "700",
                cursor: isValidKey ? "pointer" : "not-allowed",
                fontFamily: "var(--font-crypto)",
                transition: "all 0.3s ease",
              }}
            >
              Import Wallet
            </button>

            <button
              onClick={handlePaste}
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "#333",
                color: "white",
                border: "1px solid #555",
                fontWeight: "600",
                fontFamily: "var(--font-crypto)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              Paste
            </button>
          </div>
        </>
      )}

      {status && !loading && !success && (
        <p style={{ marginTop: "10px", textAlign: "center", fontFamily: "var(--font-crypto)", color: "white" }}>
          {status}
        </p>
      )}
    </div>
  );
}
