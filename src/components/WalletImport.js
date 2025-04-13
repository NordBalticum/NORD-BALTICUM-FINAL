"use client";

// 1️⃣ Importai
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

  // 2️⃣ Import funkcija
  const handleImport = async () => {
    if (!privateKey.trim()) {
      toast.error("❌ Please enter your private key.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey.trim())) {
      toast.error("❌ Invalid private key format. Must start with 0x and have 66 characters.");
      return;
    }

    if (!user?.email) {
      toast.error("❌ User session missing. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const importedWallet = new Wallet(privateKey.trim());
      const encrypted = await encrypt(privateKey.trim());

      const { error } = await supabase
        .from("wallets")
        .update({
          encrypted_key: encrypted,
          eth_address: importedWallet.address,
          updated_at: new Date().toISOString(),
        })
        .eq("user_email", user.email);

      if (error) {
        console.error("Supabase update error:", error.message);
        toast.error("❌ Failed to update wallet in database.");
        return;
      }

      await reloadWallet(user.email);

      toast.success("✅ Wallet imported successfully!");

      setTimeout(async () => {
        try {
          await supabase.auth.refreshSession(); // ✅ Šviežinam sesiją
        } catch (err) {
          console.warn("Session refresh error:", err.message);
        }
        window.location.reload();
      }, 1800);

    } catch (err) {
      console.error("Wallet import error:", err.message);
      toast.error("❌ Invalid private key. Please check and try again.");
    } finally {
      setLoading(false);
      setPrivateKey("");
    }
  };

  // 3️⃣ UI
  return (
    <div style={{ marginTop: "32px", width: "100%", maxWidth: "460px" }}>
      <h4 style={{ textAlign: "center", marginBottom: "12px" }}>Import Wallet (Private Key)</h4>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "180px" }}>
          <MiniLoadingSpinner />
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
              fontFamily: "var(--font-crypto)",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loading ? <MiniLoadingSpinner /> : "Import Wallet"}
          </button>
        </>
      )}
    </div>
  );
}
