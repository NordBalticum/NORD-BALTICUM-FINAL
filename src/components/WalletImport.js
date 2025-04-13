"use client";

import { useState, useEffect, useRef } from "react";
import { Wallet } from "ethers";
import { useRouter } from "next/navigation";
import { useAuth, encrypt } from "@/contexts/AuthContext";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import { toast } from "react-toastify";

export default function WalletImport() {
  const { user, reloadWallet } = useAuth();
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const router = useRouter();

  // Focus on input on mount
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value.trim();
    if (value.length <= 66) {
      setPrivateKey(value);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();

    if (!privateKey) {
      toast.error("❌ Please enter your private key.");
      inputRef.current?.focus();
      return;
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
      toast.error("❌ Invalid private key format. Must start with 0x and be 66 characters.");
      inputRef.current?.focus();
      return;
    }

    if (!user?.email) {
      toast.error("❌ User session missing. Please login again.");
      return;
    }

    try {
      setLoading(true);

      const importedWallet = new Wallet(privateKey);
      if (!importedWallet.address) {
        throw new Error("Invalid wallet address.");
      }

      const encrypted = await encrypt(privateKey);

      const { error } = await supabase
        .from("wallets")
        .update({
          encrypted_key: encrypted,
          eth_address: importedWallet.address,
          updated_at: new Date().toISOString(),
        })
        .eq("user_email", user.email);

      if (error) {
        console.error("Supabase update error:", error.message || error);
        toast.error(`❌ Database error: ${error.message || "Unknown error"}`);
        return;
      }

      toast.success("✅ Wallet imported successfully!");

      await reloadWallet(user.email);

      setTimeout(() => {
        if (isMounted.current) {
          router.replace("/dashboard");
        }
      }, 2500);

    } catch (err) {
      console.error("Wallet import error:", err.message || err);
      toast.error("❌ Invalid private key. Please check and try again.");
      inputRef.current?.focus();
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setPrivateKey("");
      }
    }
  };

  return (
    <div style={{ marginTop: "32px", width: "100%", maxWidth: "460px" }}>
      <h4 style={{ textAlign: "center", marginBottom: "12px", color: "white" }}>
        Import Wallet (Private Key)
      </h4>

      <form onSubmit={handleImport}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "180px" }}>
            <MiniLoadingSpinner />
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="password"
              value={privateKey}
              onChange={handleInputChange}
              placeholder="Enter your private key"
              maxLength={66}
              autoComplete="off"
              required
              aria-label="Private Key"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.2)",
                marginBottom: "12px",
                background: "rgba(255, 255, 255, 0.08)",
                color: "white",
                fontFamily: "var(--font-crypto, monospace)",
                transition: "all 0.3s ease",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                background: loading ? "rgba(255,255,255,0.1)" : "black",
                color: "white",
                border: "1px solid white",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-crypto, monospace)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
            >
              {loading ? <MiniLoadingSpinner /> : "Import Wallet"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
