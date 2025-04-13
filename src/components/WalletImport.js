"use client";

// 1️⃣ Importai
import { useState } from "react";
import { Wallet } from "ethers";
import { supabase } from "@/utils/supabaseClient";
import { useAuth, encrypt } from "@/contexts/AuthContext";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner"; // ✅ Spinner
import { toast } from "react-toastify"; // ✅ Pridedam Toast

export default function WalletImport() {
  const { user, reloadWallet } = useAuth();
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);

  // 2️⃣ Importavimo funkcija
  const handleImport = async () => {
    if (!privateKey.trim()) {
      toast.error("❌ Please enter your private key.");
      return;
    }

    if (!privateKey.trim().startsWith("0x") || privateKey.trim().length !== 66) {
      toast.error("❌ Invalid private key format.");
      return;
    }

    try {
      setLoading(true);

      const importedWallet = new Wallet(privateKey.trim()); // ✅ Patikrinam ar valid key
      const encrypted = await encrypt(privateKey.trim());   // ✅ Saugiai šifruojam

      // ✅ Atnaujinam walletą Supabase
      const { error } = await supabase
        .from("wallets")
        .update({
          encrypted_key: encrypted,
          eth_address: importedWallet.address,
          updated_at: new Date().toISOString(), // ✅ Gera praktika (jei yra updated_at laukelis)
        })
        .eq("user_email", user.email);

      if (error) {
        console.error("Supabase update error:", error.message);
        toast.error("❌ Failed to update wallet.");
        return;
      }

      await reloadWallet(user.email); // ✅ Reloadinam naują wallet

      toast.success("✅ Wallet imported successfully! Reloading...");

      setTimeout(() => {
        window.location.reload();
      }, 1800);

    } catch (err) {
      console.error("Import Wallet Error:", err.message);
      toast.error("❌ Invalid private key.");
    } finally {
      setLoading(false);
      setPrivateKey("");
    }
  };

  // 3️⃣ UI
  return (
    <div style={{ marginTop: "32px", width: "100%", maxWidth: "460px" }}>
      <h4 style={{ textAlign: "center", marginBottom: "12px" }}>Import Wallet (Private Key)</h4>

      {/* ✅ Loading state */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "180px" }}>
          <MiniLoadingSpinner />
        </div>
      ) : (
        <>
          {/* ✅ Input */}
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

          {/* ✅ Button */}
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
            }}
          >
            Import Wallet
          </button>
        </>
      )}
    </div>
  );
}
