"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalances } from "@/contexts/BalanceContext";
import SwipeSelector from "@/components/SwipeSelector";
import SuccessModal from "@/components/modals/SuccessModal";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

const networkShortNames = {
  eth: "ETH",
  bnb: "BNB",
  tbnb: "tBNB",
  matic: "MATIC",
  avax: "AVAX",
};

const buttonColors = {
  eth: "#0072ff",
  bnb: "#f0b90b",
  tbnb: "#f0b90b",
  matic: "#8247e5",
  avax: "#e84142",
};

export default function Send() {
  const router = useRouter();
  const { user, loading: userLoading } = useMagicLink();
  const { wallet, activeNetwork, setActiveNetwork, loading: walletLoading } = useWallet();
  const { balance, balanceEUR, maxSendable, refreshBalance, loading: balanceLoading } = useBalances();

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [balanceUpdated, setBalanceUpdated] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Tik patikrinam ar window egzistuoja
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  const { sendTransaction } = isClient ? require("@/contexts/SendCryptoContext").useSendCrypto() : { sendTransaction: null };

  useEffect(() => {
    if (isClient && !userLoading && user === null) {
      router.replace("/");
    }
  }, [user, userLoading, isClient, router]);

  useEffect(() => {
    if (isClient && activeNetwork === undefined) {
      setActiveNetwork("eth");
    }
  }, [isClient, activeNetwork, setActiveNetwork]);

  const isLoading = userLoading || walletLoading || balanceLoading || !isClient;

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user || !wallet) {
    return null;
  }

  const parsedAmount = Number(amount || 0);
  const fee = parsedAmount * 0.03;
  const amountAfterFee = parsedAmount - fee;

  const shortName = useMemo(() => {
    if (!activeNetwork) return "";
    return networkShortNames[activeNetwork.toLowerCase()] || "";
  }, [activeNetwork]);

  const netBalance = activeNetwork ? balance(activeNetwork) : 0;
  const netEUR = activeNetwork ? balanceEUR(activeNetwork) : 0;
  const netSendable = activeNetwork ? maxSendable(activeNetwork) : 0;

  const handleNetworkChange = useCallback(async (network) => {
    if (!network) return;
    setActiveNetwork(network);
    if (user?.email) {
      await refreshBalance(user.email, network);
    }
    setToastMessage(`Network switched to ${networkShortNames[network] || network.toUpperCase()}`);
    setTimeout(() => setToastMessage(""), 2000);
  }, [user, setActiveNetwork, refreshBalance]);

  const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const handleSend = () => {
    if (!isClient || !sendTransaction) return;

    const trimmed = receiver.trim();
    if (!trimmed || !isValidAddress(trimmed)) {
      alert("Invalid receiver address.");
      return;
    }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Amount must be a positive number.");
      return;
    }
    if (parsedAmount > netSendable) {
      alert(`Max sendable: ${netSendable.toFixed(6)} ${shortName}`);
      return;
    }
    if (parsedAmount > netBalance) {
      alert(`Insufficient balance. You have only ${netBalance.toFixed(6)} ${shortName}.`);
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    if (!isClient || !sendTransaction) return;

    setShowConfirm(false);
    setSending(true);

    const result = await sendTransaction({
      receiver: receiver.trim(),
      amount,
      network: activeNetwork,
    });

    setSending(false);

    if (result?.success) {
      setReceiver("");
      setAmount("");
      setTxHash(result.hash);
      await refreshBalance(user.email, activeNetwork);
      setBalanceUpdated(true);
      setShowSuccess(true);
    } else {
      alert(result?.message || "Transaction failed");
    }
  };

  useEffect(() => {
    if (balanceUpdated) {
      const timer = setTimeout(() => setBalanceUpdated(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [balanceUpdated]);

  const buttonStyle = {
    backgroundColor: buttonColors[activeNetwork?.toLowerCase()] || "black",
    color: "white",
    border: "2px solid white",
    borderRadius: "14px",
    padding: "14px",
    fontWeight: "700",
    textTransform: "uppercase",
    fontFamily: "var(--font-crypto)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`${styles.main} ${background.gradient}`}
    >
      {/* Likęs tavo kodas */}
    </motion.main>
  );
}
