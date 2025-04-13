"use client";

import { useState } from "react";
import { Wallet } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useAuth, encrypt } from "@/contexts/AuthContext";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import { toast } from "react-toastify";

export default function WalletImport() {
  const { user, reloadWallet } = useAuth();
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!privateKey.trim()) {
      toast.error("❌ Please enter your private key.");
      return;
    }

    const trimmedKey = privateKey.trim();

    if (!/^0x[0-9a-fA-F]{64}$/.test(trimmedKey)) {
      toast.error("❌ Invalid private key format.");
      return;
    }

    try {
      setLoading(true);

      const importedWallet = new Wallet(trimmedKey);
      const encrypted = await encrypt(trimmedKey);

      const { error } = await supabase
        .from("wallets")
        .update({
          encrypted_key: encrypted,
          eth_address: importedWallet.address,
          updated_at: new Date().toISOString(),
        })
        .eq("user_email", user.email);

      if (error) throw new Error(error.message);

      await reloadWallet(user.email);

      toast.success("✅ Wallet imported successfully! Redirecting...");

      setPrivateKey("");

      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/dashboard";
        }
      }, 1800);
    } catch (err) {
      console.error("Import Wallet Error:", err.message);
      toast.error("❌ Failed to import wallet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "32px", width: "100%", maxWidth: "460px" }}>
      <h4 style={{
        textAlign: "center",
        marginBottom: "12px",
        color: "white",
        fontFamily: "var(--font-crypto)"
      }}>
        Import Wallet (Private Key)
      </h4>

      {loading ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "180px"
        }}>
          <MiniLoadingSpinner />
        </div>
      ) : (
        <>
          <input
            type="password"
            placeholder="Enter your private key"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            autoFocus
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
              marginBottom: "12px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "white",
              fontFamily: "var(--font-crypto)",
              fontSize: "15px",
              outline: "none",
            }}
            autoComplete="off"
            spellCheck="false"
          />

          <button
            onClick={handleImport}
            disabled={loading || !privateKey.trim()}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              background: loading || !privateKey.trim() ? "#333" : "black",
              color: "white",
              border: "1px solid white",
              fontWeight: "700",
              cursor: loading || !privateKey.trim() ? "not-allowed" : "pointer",
              fontFamily: "var(--font-crypto)",
              fontSize: "16px",
              transition: "all 0.3s ease",
            }}
          >
            Import Wallet
          </button>
        </>
      )}
    </div>
  );
}
