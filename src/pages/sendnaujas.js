// src/app/sendnaujas.js
"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSend } from "@/contexts/SendContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";
import { useScale } from "@/hooks/useScale";

import SuccessModal from "@/components/modals/SuccessModal";
import ErrorModal from "@/components/modals/ErrorModal";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

// ─────────────────────────────────────────
// NETWORK DEFINITIONS
// ─────────────────────────────────────────
const NETWORKS = {
  eth:   { label: "ETH",   min: 0.001,  color: "#0072ff", explorer: "https://etherscan.io/tx/" },
  bnb:   { label: "BNB",   min: 0.0005, color: "#f0b90b", explorer: "https://bscscan.com/tx/" },
  tbnb:  { label: "tBNB",  min: 0.0005, color: "#f0b90b", explorer: "https://testnet.bscscan.com/tx/" },
  matic: { label: "MATIC", min: 0.1,    color: "#8247e5", explorer: "https://polygonscan.com/tx/" },
  avax:  { label: "AVAX",  min: 0.01,   color: "#e84142", explorer: "https://snowtrace.io/tx/" },
};

const NETWORK_LIST = Object.entries(NETWORKS).map(([symbol, { label, color }]) => ({
  name: label,
  symbol,
  color,
  logo: `/icons/${symbol.includes("bnb") ? "bnb" : symbol}.svg`,
}));

// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────
export default function SendPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeNetwork, switchNetwork } = useNetwork();
  const { ready, loading: sysLoading } = useSystemReady();
  const { sendTransaction, sending, gasFee, adminFee, totalFee, feeLoading, feeError, calculateFees } = useSend();
  const { balances, prices } = useBalance();
  const scale = useScale();

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState("");

  const [selectedIndex, setSelectedIndex] = useState(
    NETWORK_LIST.findIndex(n => n.symbol === activeNetwork)
  );

  const cfg = NETWORKS[activeNetwork] || {};
  const { label: short, min, color: btnClr, explorer } = cfg;

  const val = useMemo(() => parseFloat(amount) || 0, [amount]);
  const bal = useMemo(() => balances?.[activeNetwork] || 0, [balances, activeNetwork]);

  const eurBal = useMemo(() => {
    const rate = prices?.[activeNetwork]?.eur ?? 0;
    return (bal * rate).toFixed(2);
  }, [prices, activeNetwork, bal]);

  const usdBal = useMemo(() => {
    const rate = prices?.[activeNetwork]?.usd ?? 0;
    return (bal * rate).toFixed(2);
  }, [prices, activeNetwork, bal]);

  const isValidAddress = useCallback(
    (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr.trim()),
    []
  );

  useEffect(() => {
    if (val > 0) calculateFees(activeNetwork, val);
  }, [activeNetwork, val, calculateFees]);

  useEffect(() => {
    if (ready && !user) router.replace("/");
  }, [ready, user, router]);

  const handleSend = useCallback(() => {
    if (!isValidAddress(receiver)) return alert("❌ Invalid address");
    if (val < min) return alert(`❌ Minimum is ${min} ${short}`);
    if (val + totalFee > bal) return alert("❌ Insufficient balance");
    setConfirmOpen(true);
  }, [receiver, val, min, short, totalFee, bal, isValidAddress]);

  const onConfirm = useCallback(async () => {
    setConfirmOpen(false);
    setError(null);

    try {
      const hash = await sendTransaction({
        to: receiver.trim().toLowerCase(),
        amount: val,
        userEmail: user.email,
      });
      setTxHash(hash);
      setReceiver("");
      setAmount("");
      setSuccessOpen(true);
      navigator.vibrate?.(80);
    } catch (e) {
      setError(e.message || "Transaction failed");
    }
  }, [receiver, val, user, sendTransaction]);

  const switchNet = useCallback((idx) => {
    const net = NETWORK_LIST[idx].symbol;
    if (net !== activeNetwork) {
      switchNetwork(net);
      setSelectedIndex(idx);
      setReceiver("");
      setAmount("");
      navigator.vibrate?.(10);
    }
  }, [activeNetwork, switchNetwork]);

  if (sysLoading) {
    return (
      <div className={styles.loader}>
        <MiniLoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <main className={`${styles.main} ${background.gradient}`} style={{ transform: `scale(${scale})` }}>
      <div className={styles.wrapper}>
        
        {/* Network Selector */}
        <div className={styles.selectorContainer}>
          {NETWORK_LIST.map((net, idx) => (
            <motion.div
              key={net.symbol}
              className={`${styles.card} ${idx === selectedIndex ? styles.selected : ""}`}
              onClick={() => switchNet(idx)}
              whileTap={{ scale: 0.96 }}
            >
              <Image src={net.logo} alt={net.name} width={44} height={44} />
              <span>{net.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Balance Info */}
        <div className={styles.balanceTable}>
          <p>Your Balance: <strong>{bal.toFixed(6)} {short}</strong></p>
          <p>≈ €{eurBal} | ≈ ${usdBal}</p>
        </div>

        {/* Form Inputs */}
        <div className={styles.walletActions}>
          <input
            type="text"
            placeholder="0x..."
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            disabled={sending}
            className={styles.inputField}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={sending}
            className={styles.inputField}
            min="0"
          />

          {/* Fees */}
          <div className={styles.feesInfo}>
            {feeLoading ? (
              <p><MiniLoadingSpinner size={14} /> Calculating fees…</p>
            ) : feeError ? (
              <p style={{ color: "red" }}>Fee error: {feeError}</p>
            ) : (
              <>
                <p>Total: {(val + totalFee).toFixed(6)} {short}</p>
                <p>Min: {min} {short}</p>
              </>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={!receiver || sending || feeLoading}
            className={styles.sendNowButton}
            style={{ backgroundColor: btnClr, color: "#fff" }}
          >
            {sending ? <MiniLoadingSpinner size={20} color="#fff" /> : "SEND NOW"}
          </button>
        </div>

        {/* Confirm Modal */}
        {confirmOpen && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <h3>Confirm Transaction</h3>
              <p><strong>To:</strong> {receiver}</p>
              <p><strong>Amount:</strong> {val} {short}</p>
              <p><strong>Gas Fee:</strong> {gasFee.toFixed(6)} {short}</p>
              <p><strong>Admin Fee:</strong> {adminFee.toFixed(6)} {short}</p>
              <p><strong>Total:</strong> {(val + totalFee).toFixed(6)} {short}</p>
              <div className={styles.modalActions}>
                <button onClick={onConfirm} disabled={sending}>
                  {sending ? "Processing…" : "Confirm"}
                </button>
                <button onClick={() => setConfirmOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successOpen && txHash && (
          <SuccessModal
            message="✅ Transaction Sent!"
            transactionHash={txHash}
            explorerUrl={`${explorer}${txHash}`}
            onClose={() => setSuccessOpen(false)}
          />
        )}

        {/* Error Modal */}
        {error && <ErrorModal error={error} onClose={() => setError(null)} />}
      </div>
    </main>
  );
}
