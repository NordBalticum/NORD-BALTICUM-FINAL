"use client";

import { useState } from "react";
import { Wallet } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext"; 
import { encrypt } from "@/contexts/AuthContext"; 

export default function WalletImport() {
  const { user } = useAuth();
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
      const wallet = new Wallet(privateKey.trim()); // ✅ Validacija

      const encrypted = await encrypt(privateKey.trim()); // ✅ Šifruojam tavo būdu

      // ✅ Update Supabase lentelę
      const { error } = await supabase
        .from("wallets")
        .update({
          encrypted_key: encrypted,
          eth_address: wallet.address, // ✅ Atnaujinam adresą
        })
        .eq("user_email", user.email);

      if (error) {
        console.error("Supabase update error:", error.message);
        setStatus("❌ Failed to update wallet.");
        return;
      }

      setStatus("✅ Wallet imported successfully! Reloading...");
      setPrivateKey("");

      // ✅ Automatinis reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);

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
          background: loading ? "#999" : "black",
          color: "white",
          border: "1px solid white",
          fontWeight: "700",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Importing..." : "Import Wallet"}
      </button>
      {status && (
        <p style={{ marginTop: "10px", textAlign: "center", fontFamily: "var(--font-crypto)" }}>
          {status}
        </p>
      )}
    </div>
  );
}
