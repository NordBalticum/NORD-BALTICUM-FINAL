"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import styles from "@/components/walletimport.module.css";

export default function WalletImport() {
  const { user, importWalletFromPrivateKey, walletLoading } = useAuth();

  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const isMounted = useRef(true);
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
      toast.error("❌ Invalid private key. Must be 66 characters and start with 0x.");
      inputRef.current?.focus();
      return;
    }

    if (!user?.email) {
      toast.error("❌ Session expired. Please login again.");
      return;
    }

    try {
      setLoading(true);
      await importWalletFromPrivateKey(user.email, privateKey);

      if (isMounted.current) {
        toast.success("✅ Wallet imported successfully!");
        setPrivateKey("");
        router.replace("/dashboard");
      }
    } catch (err) {
      console.error("Wallet import error:", err.message || err);
      toast.error("❌ Import failed. Please try again.");
      inputRef.current?.focus();
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className={styles.walletImportWrapper}>
      <h4 className={styles.title}>Import Wallet (Private Key)</h4>

      <form onSubmit={handleImport}>
        {loading || walletLoading ? (
          <div className={styles.spinnerWrapper}>
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
              className={styles.input}
            />

            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? <MiniLoadingSpinner /> : "Import Wallet"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
