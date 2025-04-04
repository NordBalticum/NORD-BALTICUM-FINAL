"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalances } from "@/contexts/BalanceContext";

import SwipeSelector from "@/components/SwipeSelector";
import SuccessModal from "@/components/modals/SuccessModal";

import styles from "@/styles/dashboard.module.css"; // KLONUOTAS iš dashboard
import background from "@/styles/background.module.css";

const networkShortNames = {
  eth: "ETH",
  bnb: "BNB",
  tbnb: "tBNB",
  matic: "MATIC",
  avax: "AVAX",
};

export default function SendPage() {
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
  const [toastMessage, setToastMessage] = useState("");
  const [balanceUpdated, setBalanceUpdated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [sendTransaction, setSendTransaction] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
      import("@/contexts/SendCryptoContext").then((mod) => {
        setSendTransaction(() => mod.useSendCrypto().sendTransaction);
      });
    }
  }, []);

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

  const isLoading = !isClient || userLoading || walletLoading || balanceLoading || !sendTransaction;

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const netBalance = activeNetwork ? balance(activeNetwork) : 0;
  const netEUR = activeNetwork ? balanceEUR(activeNetwork) : 0;
  const netSendable = activeNetwork ? maxSendable(activeNetwork) : 0;

  const parsedAmount = parseFloat(amount) || 0;
  const fee = parsedAmount * 0.03;
  const amountAfterFee = parsedAmount - fee;

  const handleNetworkChange = useCallback(async (network) => {
    if (!network) return;
    setActiveNetwork(network);
    if (user?.email) {
      await refreshBalance(user.email, network);
    }
    setToastMessage(`Switched to ${networkShortNames[network]}`);
    setTimeout(() => setToastMessage(""), 2000);
  }, [user, setActiveNetwork, refreshBalance]);

  const isValidAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const handleSend = () => {
    if (!isValidAddress(receiver)) {
      alert("Invalid address.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      alert("Invalid amount.");
      return;
    }
    if (parsedAmount > netSendable) {
      alert(`Max sendable: ${netSendable.toFixed(6)}`);
      return;
    }
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setSending(true);
    setShowConfirm(false);
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
      alert(result?.message || "Transaction failed.");
    }
  };

  return (
    <motion.main
      className={`${styles.main} ${background.gradient}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.dashboardContainer}>
        <SwipeSelector mode="send" onSelect={handleNetworkChange} />

        <div className={styles.balanceContainer}>
          <p>Balance: {netBalance.toFixed(6)} {networkShortNames[activeNetwork]}</p>
          <p>~€{netEUR.toFixed(2)}</p>
          <p>Max Sendable: {netSendable.toFixed(6)} {networkShortNames[activeNetwork]}</p>
        </div>

        <div className={styles.walletActions}>
          <input
            className={styles.input}
            type="text"
            placeholder="Receiver Address"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
          />
          <input
            className={styles.input}
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p>Recipient will receive: {amountAfterFee.toFixed(6)} {networkShortNames[activeNetwork]}</p>

          <button
            className={styles.button}
            onClick={handleSend}
            disabled={!receiver || !amount || sending}
          >
            {sending ? "Sending..." : "Send Now"}
          </button>
        </div>

        {showConfirm && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <p>Confirm sending {parsedAmount} {networkShortNames[activeNetwork]}</p>
              <button onClick={confirmSend} className={styles.confirmButton}>Confirm</button>
              <button onClick={() => setShowConfirm(false)} className={styles.cancelButton}>Cancel</button>
            </div>
          </div>
        )}

        {showSuccess && (
          <SuccessModal
            message="Transaction Completed!"
            txHash={txHash}
            networkKey={activeNetwork}
            onClose={() => setShowSuccess(false)}
          />
        )}
      </div>
    </motion.main>
  );
}
