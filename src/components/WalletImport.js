"use client";

import { useState } from "react";
import { Wallet } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { encrypt } from "@/contexts/AuthContext";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner"; // ✅ Importuojam tavo spinnerį

export default function WalletImport() {
  const { user, reloadWallet } = useAuth();
  const [privateKey, setPrivateKey] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // ✅ Naujas state successui

  const handleImport = async () => {
    if (!privateKey.trim()) {
      setStatus("❌ Please enter a private key.");
      return;
    }

    try {
      setLoading(true);
      const wallet = new Wallet(privateKey.trim());

      const encrypted = await encrypt(privateKey.trim());

      const { error } = await supabase
        .from("wallets")
        .update({
          encrypted_key: encrypted,
          eth_address: wallet.address,
        })
        .eq("user_email", user.email);

      if (error) {
        console.error("Supabase update error:", error.message);
        setStatus("❌ Failed to update wallet.");
        return;
      }

      setPrivateKey("");
      setStatus("");
      setSuccess(true); // ✅ Rodom success modalą

      await reloadWallet(user.email);

      // ✅ Dabar mažą delay + reload
      setTimeout(() => {
        window.location.reload();
      }, 1800); // 1.8 sekundės kad jaustų maloniai modalą

    } catch (err) {
      console.error("Import Wallet Error:", err.message);
      setStatus("❌ Invalid private key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "32px", width: "100%", maxWidth: "460px" }}>
      <h4 style={{ textAlign: "center", marginBottom: "12px" }}>Import Wallet (Private Key)</h4>

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
          color: "white"
        }}>
          ✅ Wallet imported successfully! Reloading...
        </div>
      ) : (
        <>
          <input
            type="password"
            placeholder="Enter your private key"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
              marginBottom: "12px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "white",
              fontFamily: "var(--font-crypto)",
            }}
          />
          <button
            onClick={handleImport}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              background: "black",
              color: "white",
              border: "1px solid white",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Import Wallet
          </button>
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
