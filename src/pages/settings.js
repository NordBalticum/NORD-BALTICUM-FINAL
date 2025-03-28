"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGenerateWallet } from "@/contexts/GenerateWalletContext";
import { useRouter } from "next/navigation";
import StarsBackground from "@/components/StarsBackground";
import AvatarModalPicker from "@/components/AvatarModalPicker";
import AvatarDisplay from "@/components/AvatarDisplay";
import SuccessModal from "@/components/SuccessModal";
import styles from "@/styles/settings.module.css";
import { Wallet } from "ethers";

export default function SettingsPage() {
  const { user, wallet, logout, supabase, refreshBalances } = useAuth();
  const { generateOneWalletForAllNetworks } = useGenerateWallet();
  const router = useRouter();

  const [emailInput, setEmailInput] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [success, setSuccess] = useState(false);
  const [walletSuccess, setWalletSuccess] = useState(false);

  useEffect(() => {
    if (wallet?.address) setWalletAddress(wallet.address);
  }, [wallet]);

  const handleChangeEmail = async () => {
    if (!emailInput) return alert("Please enter a new email.");
    const { error } = await supabase.auth.updateUser({ email: emailInput });
    if (error) alert("Error: " + error.message);
    else alert("Magic Link has been sent to your new email.");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    alert("Wallet address copied!");
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const handleAvatarChange = () => {
    setAvatarKey(Date.now());
    setShowAvatarModal(false);
    setSuccess(true);
  };

  const handleGenerateNewWallet = async () => {
    if (!user?.email || !user?.id) return alert("No user session found.");

    // Tikrinam ar email patvirtintas
    const isEmailVerified = user?.email_confirmed_at !== null;
    if (!isEmailVerified) {
      return alert("Please confirm your email address before generating a new wallet. Check your inbox.");
    }

    const confirm = window.confirm("Are you sure you want to generate a new wallet? Your current one will be deleted.");
    if (!confirm) return;

    try {
      const newWallets = generateOneWalletForAllNetworks();
      const first = Object.values(newWallets)[0];

      // 1. Ištrinti seną įrašą
      await supabase.from("wallets").delete().eq("email", user.email);

      // 2. Įrašyti naują
      await supabase.from("wallets").insert({
        user_id: user.id,
        email: user.email,
        bsc: first.address,
        tbnb: first.address,
        eth: first.address,
        pol: first.address,
        avax: first.address,
      });

      // 3. Atnaujinti lokalų state
      localStorage.setItem("userWallets", JSON.stringify(newWallets));
      setWalletAddress(first.address);
      setWalletSuccess(true);

      // 4. Refresh balance
      await refreshBalances?.();
    } catch (err) {
      console.error("❌ Wallet generation error:", err.message);
      alert("Failed to generate new wallet.");
    }
  };

  return (
    <div className={styles.container}>
      <StarsBackground />
      <div className={styles.box}>
        <h2 className={styles.heading}>Profile Settings</h2>

        <div
          className={styles.avatarContainer}
          onClick={() => setShowAvatarModal(true)}
          title="Click to change avatar"
        >
          <AvatarDisplay walletAddress={wallet?.address} size={80} key={avatarKey} />
          <p className={styles.avatarText}>Change Avatar</p>
        </div>

        <p><strong>Email:</strong> {user?.email}</p>

        <div className={styles.walletBox} onClick={handleCopy} title="Click to copy">
          <span><strong>Wallet Address:</strong></span>
          <span className={styles.walletAddress}>{walletAddress || "Unavailable"}</span>
        </div>

        <hr />

        <div className={styles.section}>
          <h4>Change Email</h4>
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

        <hr />

        <div className={styles.section}>
          <h4>Generate New Wallet</h4>
          <button className={styles.dangerButton} onClick={handleGenerateNewWallet}>
            Generate New Wallet
          </button>
        </div>

        <hr />

        <button className={styles.logout} onClick={handleLogout}>
          Log Out
        </button>
      </div>

      {showAvatarModal && (
        <AvatarModalPicker
          onClose={handleAvatarChange}
          onSelect={() => {}}
        />
      )}

      {success && (
        <SuccessModal
          message="Avatar updated successfully!"
          onClose={() => setSuccess(false)}
        />
      )}

      {walletSuccess && (
        <SuccessModal
          message="New wallet generated successfully!"
          onClose={() => setWalletSuccess(false)}
        />
      )}
    </div>
  );
}
