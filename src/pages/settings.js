"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext"; // ✅ Naudojam Ultimate Auth
import { supabase } from "@/utils/supabaseClient";

import styles from "@/styles/settings.module.css";
import background from "@/styles/background.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { user, wallet, signOut } = useAuth(); // ✅ Ultimate hook'as

  const [emailInput, setEmailInput] = useState("");
  const [walletAddress, setWalletAddress] = useState("Loading...");
  const [isClient, setIsClient] = useState(false);

  // 1️⃣ Patikrinam ar esam kliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  // 2️⃣ Užkraunam piniginės adresą
  useEffect(() => {
    if (!isClient || !wallet?.wallet) return;
    setWalletAddress(wallet.wallet.address); // ✅ Universalus ETH/BSC adresas
  }, [wallet, isClient]);

  // 3️⃣ Email keitimas (Magic Link siunčiamas)
  const handleChangeEmail = async () => {
    const email = emailInput.trim();
    if (!email) return alert("Please enter a new email.");

    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      alert("✅ Magic Link sent to new email address.");
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  };

  // 4️⃣ Kopijuoti piniginės adresą
  const handleCopyWallet = () => {
    if (!walletAddress || walletAddress.includes("not") || walletAddress.includes("Error")) return;
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(walletAddress).then(() => {
        alert("✅ Wallet address copied.");
      });
    }
  };

  // 5️⃣ Atsijungimas
  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  if (!isClient || !user) return <div className={styles.loading}>Loading profile...</div>;

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <div className={styles.box}>
        <Image
          src="/icons/logo.svg"
          alt="NordBalticum Logo"
          width={220}
          height={80}
          priority
          className={styles.logo}
        />

        <div
          className={styles.walletBox}
          onClick={handleCopyWallet}
          title="Click to copy wallet address"
        >
          <p className={styles.walletLabel}>Your Wallet:</p>
          <p className={styles.walletAddress}>{walletAddress}</p>
        </div>

        <div className={styles.section}>
          <h4>Change Email</h4>
          <p className={styles.currentEmail}>
            Current: <strong>{user.email}</strong>
          </p>
          <input
            type="email"
            placeholder="New email address"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className={styles.input}
          />
          <button className={styles.button} onClick={handleChangeEmail}>
            Send Magic Link
          </button>
        </div>

        <button className={styles.logout} onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </main>
  );
}
