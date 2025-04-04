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

// ADMIN WALLET ADDRESS
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET;

// RPC URL'ai
const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

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

  const [ethersLoaded, setEthersLoaded] = useState(false);
  const [ethersUtils, setEthersUtils] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
      import("ethers").then((mod) => {
        setEthersUtils(mod);
        setEthersLoaded(true);
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

  const isLoading = userLoading || walletLoading || balanceLoading || !isClient || !ethersLoaded;

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

  const sendTransaction = async ({ receiver, amount, network }) => {
    if (typeof window === "undefined" || !ethersUtils) return { success: false, message: "Client only." };
    try {
      const stored = localStorage.getItem("userPrivateKey");
      if (!stored) throw new Error("Private key not found.");

      const { Wallet, JsonRpcProvider, parseEther } = ethersUtils;
      const { key } = JSON.parse(stored);
      const provider = new JsonRpcProvider(RPC[network]);
      const signer = new Wallet(key, provider);

      const fullAmount = parseEther(amount.toString());
      const feeAmount = fullAmount.mul(3).div(100);
      const amountAfterFee = fullAmount.sub(feeAmount);

      const [userTx, adminTx] = await Promise.all([
        signer.sendTransaction({ to: receiver, value: amountAfterFee, gasLimit: 21000 }),
        signer.sendTransaction({ to: ADMIN_ADDRESS, value: feeAmount, gasLimit: 21000 }),
      ]);

      return { success: true, hash: userTx.hash };
    } catch (error) {
      console.error("Send transaction failed:", error);
      return { success: false, message: error.message || "Transaction failed." };
    }
  };

  const handleSend = () => {
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
      const timer = setTimeout(() => setBalanceUpdated(false), 3000);
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
      <div className={styles.wrapper}>
        <AnimatePresence>
          {balanceUpdated && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className={styles.successAlert}
            >
              Balance Updated!
            </motion.div>
          )}
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className={styles.successAlert}
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Transfer crypto securely & instantly</p>

        <SwipeSelector mode="send" onSelect={handleNetworkChange} />

        <div className={styles.balanceTable}>
          <p className={styles.whiteText}>
            Total Balance:&nbsp;
            <span className={styles.balanceAmount}>
              {netBalance.toFixed(6)} {shortName}
            </span> (~€{netEUR.toFixed(2)})
          </p>
          <p className={styles.whiteText}>
            Max Sendable:&nbsp;
            <span className={styles.balanceAmount}>
              {netSendable.toFixed(6)} {shortName}
            </span> (includes 3% fee)
          </p>
        </div>

        <div className={styles.walletActions}>
          <input
            type="text"
            placeholder="Receiver address"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className={styles.inputField}
          />
          <input
            type="number"
            placeholder="Amount to send"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
          />
          <p className={styles.feeBreakdown}>
            Recipient receives <strong>{amountAfterFee.toFixed(6)} {shortName}</strong>
            <br />Includes 3% platform fee.
          </p>
          <button
            onClick={handleSend}
            style={buttonStyle}
            disabled={!user || sending || !receiver || !amount}
          >
            {sending ? <div className={styles.loader}></div> : "SEND NOW"}
          </button>
        </div>

        {showConfirm && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <div className={styles.modalTitle}>Final Confirmation</div>
              <div className={styles.modalInfo}>
                <p><strong>Network:</strong> {shortName}</p>
                <p><strong>To:</strong> {receiver}</p>
                <p><strong>Send:</strong> {parsedAmount.toFixed(6)} {shortName}</p>
                <p><strong>Gets:</strong> {amountAfterFee.toFixed(6)} {shortName}</p>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.modalButton} onClick={confirmSend}>Confirm</button>
                <button className={`${styles.modalButton} ${styles.cancel}`} onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccess && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <SuccessModal
              message="Transaction completed!"
              txHash={txHash}
              networkKey={activeNetwork}
              onClose={() => setShowSuccess(false)}
            />
          </motion.div>
        )}
      </div>
    </motion.main>
  );
}
