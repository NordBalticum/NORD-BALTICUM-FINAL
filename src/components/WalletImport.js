"use client";

import { useState } from "react";
import { Wallet } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { encrypt } from "@/contexts/AuthContext";

export default function WalletImport() {
  const { user, reloadWallet } = useAuth();
  const [privateKey, setPrivateKey] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

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

      setStatus("✅ Wallet imported successfully!");
      setPrivateKey("");

      await reloadWallet(user.email);

      // ✅ Suteikiam sekundės prabangų pauzę kad spinneris pasimėgautų
      setTimeout(() => {
        window.location.reload();
      }, 1200);

    } catch (err) {
      console.error("Import Wallet Error:", err.message);
      setStatus("❌ Invalid private key.");
    } finally {
      // Svarbu: loading false tik po reload
    }
  };

  return (
    <div style={{ marginTop: "32px", width: "100%", maxWidth: "460px" }}>
      <h4 style={{ textAlign: "center", marginBottom: "12px" }}>Import Wallet (Private Key)</h4>
      <input
        type="password"
        placeholder="Enter your private key"
        value={privateKey}
        onChange={(e) => setPrivateKey(e.target.value)}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.2)",
          marginBottom: "12px",
          background: "rgba(255, 255, 255, 0.08)",
          color: "white",
          fontFamily: "var(--font-crypto)",
          opacity: loading ? 0.6 : 1,
        }}
      />
      <button
        onClick={handleImport}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          background: loading ? "#999" : "black",
          color: "white",
          border: "1px solid white",
          fontWeight: "700",
          cursor: loading ? "not-allowed" : "pointer",
          position: "relative",
        }}
      >
        {loading ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}>
            <div className="spinner" style={{
              width: "18px",
              height: "18px",
              border: "2px solid white",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            Importing...
          </div>
        ) : (
          "Import Wallet"
        )}
      </button>
      {status && (
        <p style={{ marginTop: "10px", textAlign: "center", fontFamily: "var(--font-crypto)" }}>
          {status}
        </p>
      )}

      {/* Spinner CSS */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
