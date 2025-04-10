"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

import { useAuth } from "@/contexts/AuthContext"; 
import { supabase } from "@/utils/supabaseClient";

import WalletImport from "@/components/WalletImport"; 
import styles from "@/styles/settings.module.css";
import background from "@/styles/background.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { user, wallet, signOut } = useAuth();

  const [emailInput, setEmailInput] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingDeleteWallet, setLoadingDeleteWallet] = useState(false);
  const [loadingDeleteAccount, setLoadingDeleteAccount] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(() => () => {});
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");

  useEffect(() => {
    if (wallet?.wallet?.address) {
      setWalletAddress(wallet.wallet.address);
    }
  }, [wallet]);

  const handleChangeEmail = async () => {
    const email = emailInput.trim();
    if (!email) {
      toast.error("❌ Please enter a new email address.");
      return;
    }
    try {
      setLoadingEmail(true);
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast.success("✅ Magic Link sent successfully.");
      setEmailInput("");
    } catch (error) {
      console.error("Email update error:", error.message);
      toast.error(`❌ ${error.message}`);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleCopyWallet = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success("✅ Wallet address copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard error:", err);
      toast.error("❌ Failed to copy address.");
    }
  };

  const handleDeleteWallet = async () => {
    try {
      setLoadingDeleteWallet(true);
      const newWallet = wallet.wallet.createRandom();
      const encrypted = await encrypt(newWallet.privateKey);
      await supabase.from("wallets")
        .update({ 
          encrypted_key: encrypted, 
          eth_address: newWallet.address 
        })
        .eq("user_email", user.email);

      toast.success("✅ Wallet reset successfully. Reloading...");
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error("Delete wallet error:", error.message);
      toast.error("❌ Failed to reset wallet.");
    } finally {
      setLoadingDeleteWallet(false);
      closeModal();
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoadingDeleteAccount(true);
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
      toast.success("✅ Account deleted successfully.");
      router.replace("/");
    } catch (error) {
      console.error("Delete account error:", error.message);
      toast.error("❌ Failed to delete account.");
    } finally {
      setLoadingDeleteAccount(false);
      closeModal();
    }
  };

  const openModal = (title, description, action) => {
    setModalTitle(title);
    setModalDescription(description);
    setModalAction(() => action);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  if (!user || !wallet) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <Toaster position="top-center" reverseOrder={false} />

      <div className={styles.settingsContainer}>
        <div className={styles.settingsWrapper}>

          {/* === SECTION 1: WALLET INFO === */}
          <div className={styles.settingsBox}>
            <Image
              src="/icons/logo.svg"
              alt="NordBalticum Logo"
              width={220}
              height={80}
              priority
              className={styles.logo}
            />

            <div className={styles.walletBox} onClick={handleCopyWallet}>
              <p className={styles.walletLabel}>Your Wallet:</p>
              <p className={styles.walletAddress}>{walletAddress}</p>
              {copied && <p className={styles.copyStatus}>✅ Copied!</p>}
            </div>
          </div>

          {/* === SECTION 2: EMAIL CHANGE + WALLET IMPORT === */}
          <div className={styles.settingsBox}>
            <h3 className={styles.sectionTitle}>Change Email</h3>
            <input
              type="email"
              placeholder="New email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className={styles.input}
            />
            <button
              className={styles.button}
              onClick={handleChangeEmail}
              disabled={!emailInput.trim() || loadingEmail}
            >
              {loadingEmail ? "Sending..." : "Send Magic Link"}
            </button>

            <div className={styles.divider} />

            {/* Wallet Import */}
            <WalletImport />
          </div>

          {/* === SECTION 3: DANGER ZONE === */}
          <div className={styles.dangerBox}>
            <h3 className={styles.dangerTitle}>Danger Zone</h3>

            <button
              className={styles.dangerButton}
              onClick={() => openModal(
                "Reset Wallet",
                "Are you sure you want to reset your wallet? This will generate a new private key.",
                handleDeleteWallet
              )}
              disabled={loadingDeleteWallet}
            >
              {loadingDeleteWallet ? "Resetting Wallet..." : "Delete Wallet (Reset Key)"}
            </button>

            <button
              className={styles.dangerButton}
              onClick={() => openModal(
                "Delete Account",
                "Are you sure you want to delete your account? This action is irreversible.",
                handleDeleteAccount
              )}
              disabled={loadingDeleteAccount}
            >
              {loadingDeleteAccount ? "Deleting Account..." : "Delete My Account"}
            </button>
          </div>

          {/* === LOGOUT (Tiny Button) === */}
          <button className={styles.logoutButton} onClick={signOut}>
            Logout
          </button>

        </div>
      </div>

      {/* === CONFIRM MODAL === */}
      <ConfirmModal
        isOpen={modalOpen}
        title={modalTitle}
        description={modalDescription}
        onConfirm={modalAction}
        onCancel={closeModal}
      />
    </main>
  );
}

// ✅ CONFIRM MODAL COMPONENT
function ConfirmModal({ isOpen, title, description, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className={styles.modalButtons}>
          <button onClick={onCancel} className={styles.modalCancel}>
            Cancel
          </button>
          <button onClick={onConfirm} className={styles.modalConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
