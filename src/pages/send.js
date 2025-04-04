"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ethers } from "ethers"; // <- TIESIOGIAI naudojam ethers.js!

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalances } from "@/contexts/BalanceContext";

import SwipeSelector from "@/components/SwipeSelector";
import SuccessModal from "@/components/modals/SuccessModal";

import styles from "@/styles/dashboard.module.css";
import background from "@/styles/background.module.css";

const networkRPC = {
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

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET; // 3% fee recipient

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
  const [balanceUpdated, setBalanceUpdated] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
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

  const isLoading = !isClient || userLoading || walletLoading || balanceLoading;

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!user || !wallet || !wallet.signers) {
    return null;
  }

  const parsedAmount = parseFloat(amount) || 0;
  const fee = parsedAmount * 0.03;
  const amountAfterFee = parsedAmount - fee;

  const netBalance = activeNetwork ? balance(activeNetwork) : 0;
  const netEUR = activeNetwork ? balanceEUR(activeNetwork) : 0;
  const netSendable = activeNetwork ? maxSendable(activeNetwork) : 0;

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

    try {
      const signer = wallet.signers[activeNetwork];
      if (!signer) {
        throw new Error("Wallet signer not found.");
      }

      const fullAmount = ethers.utils.parseEther(parsedAmount.toString());
      const feeAmount = fullAmount.mul(3).div(100);
      const userAmount = fullAmount.sub(feeAmount);

      // Send to receiver
      const tx1 = await signer.sendTransaction({
        to: receiver.trim(),
        value: userAmount,
        gasLimit: 21000,
      });

      // Send 3% fee to ADMIN_ADDRESS
      const tx2 = await signer.sendTransaction({
        to: ADMIN_ADDRESS,
        value: feeAmount,
        gasLimit: 21000,
      });

      setTxHash(tx1.hash);
      await refreshBalance(user.email, activeNetwork);
      setBalanceUpdated(true);
      setShowSuccess(true);

    } catch (error) {
      console.error("Transaction error:", error);
      alert(error.message || "Transaction failed.");
    } finally {
      setSending(false);
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
          <p>Recipient receives: {amountAfterFee.toFixed(6)} {networkShortNames[activeNetwork]}</p>

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
