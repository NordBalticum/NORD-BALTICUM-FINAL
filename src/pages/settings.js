// src/app/settings.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";

import { useAuth, encrypt } from "@/contexts/AuthContext";
import { useMinimalReady } from "@/hooks/useMinimalReady";
import { supabase } from "@/utils/supabaseClient";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import styles from "@/styles/settings.module.css";
import background from "@/styles/background.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { user, wallet, signOut, importWalletFromPrivateKey } = useAuth();
  const { ready, loading } = useMinimalReady();

  const [emailInput, setEmailInput] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [privateKeyInput, setPrivateKeyInput] = useState("");
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

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleCopyWallet = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast.success("✅ Wallet address copied!");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard error:", err);
      toast.error("❌ Failed to copy address.");
    }
  };

  const handleChangeEmail = async () => {
    if (!isValidEmail(emailInput)) {
      toast.error("❌ Please enter a valid email.");
      return;
    }
    try {
      setLoadingEmail(true);
      const { error } = await supabase.auth.updateUser({ email: emailInput.trim() });
      if (error) throw error;
      toast.success("✅ Confirmation email sent! Check your inbox.");
      setEmailInput("");
    } catch (error) {
      console.error("Email change error:", error.message);
      toast.error(`❌ ${error.message}`);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleImportWallet = async () => {
    if (!privateKeyInput.trim()) return;
    await importWalletFromPrivateKey(user?.email, privateKeyInput.trim());
    setPrivateKeyInput("");
  };

  const handleDeleteWallet = async () => {
    try {
      setLoadingDeleteWallet(true);
      const newWallet = wallet.wallet.createRandom();
      const encrypted = await encrypt(newWallet.privateKey);
      await supabase
        .from("wallets")
        .update({
          encrypted_key: encrypted,
          eth_address: newWallet.address,
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

  const handleDeleteAccountRequest = () => {
    if (!user) {
      toast.error("❌ No user logged in.");
      return;
    }
    window.open(
      `mailto:support@nordbalticum.com?subject=Delete%20Account%20Request&body=I%20would%20like%20to%20delete%20my%20account.%20Email:%20${user.email}`,
      "_blank"
    );
    toast.success("✅ Request initiated. Complete the email to delete your account.");
    closeModal();
  };

  const openModal = (title, description, action) => {
    setModalTitle(title);
    setModalDescription(description);
    setModalAction(() => action);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  if (loading || !ready) {
    return (
      <div className={styles.fullscreenCenter}>
        <MiniLoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <main
      className={`${styles.container} ${background.gradient}`}
      style={{ width: "100vw", height: "100vh", overflowY: "auto" }}
    >
      <Toaster position="top-center" reverseOrder={false} />

      <div className={styles.settingsContainer}>
        <div className={styles.settingsWrapper}>
          {/* === WALLET INFO === */}
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

          {/* === IMPORT WALLET === */}
          <div className={styles.settingsBox}>
            <h2 className={styles.sectionTitle}>Import Wallet</h2>
            <input
              type="text"
              placeholder="Private key"
              value={privateKeyInput}
              onChange={(e) => setPrivateKeyInput(e.target.value)}
              className={styles.input}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <button
              className={styles.button}
              onClick={handleImportWallet}
              disabled={!privateKeyInput.trim()}
            >
              Import Wallet
            </button>
          </div>

          {/* === CHANGE EMAIL === */}
          <div className={styles.settingsBox}>
            <h2 className={styles.changeEmailTitle}>Change Email</h2>
            <input
              type="email"
              placeholder="New email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className={styles.input}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              enterKeyHint="done"
            />
            {isValidEmail(emailInput) && (
              <span className={styles.validEmailMark}>✅</span>
            )}
            <button
              className={styles.button}
              onClick={handleChangeEmail}
              disabled={!emailInput.trim() || loadingEmail}
            >
              {loadingEmail ? "Sending..." : "Send Confirmation Email"}
            </button>
          </div>

          {/* === DANGER ZONE === */}
          <div className={styles.dangerBox}>
            <h3 className={styles.dangerTitle}>Danger Zone</h3>
            <button
              className={styles.dangerButton}
              onClick={() =>
                openModal(
                  "Reset Wallet",
                  "This will generate a new wallet.",
                  handleDeleteWallet
                )
              }
              disabled={loadingDeleteWallet}
            >
              {loadingDeleteWallet ? "Resetting Wallet..." : "Reset Wallet"}
            </button>

            <button
              className={styles.dangerButton}
              onClick={() =>
                openModal(
                  "Request Account Deletion",
                  "This will open your email client.",
                  handleDeleteAccountRequest
                )
              }
              disabled={loadingDeleteAccount}
            >
              {loadingDeleteAccount ? "Requesting..." : "Request Account Deletion"}
            </button>
          </div>

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
