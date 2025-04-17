"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSend } from "@/contexts/SendContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/contexts/SystemReadyContext";
import { useScale } from "@/hooks/useScale";
import { motion } from "framer-motion";
import Image from "next/image";
import styles from "@/styles/send.module.css";
import SuccessModal from "@/components/modals/SuccessModal";
import ErrorModal from "@/components/modals/ErrorModal";
import StepModal from "@/components/modals/StepModal";
import NetworkSelector from "@/components/NetworkSelector";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import { NETWORKS } from "@/constants";

// Network metadata
const networkList = [
  { name: "Ethereum", symbol: "eth", logo: "/icons/eth.svg" },
  { name: "BNB Chain", symbol: "bnb", logo: "/icons/bnb.svg" },
  { name: "Polygon", symbol: "matic", logo: "/icons/matic.svg" },
  { name: "Avalanche", symbol: "avax", logo: "/icons/avax.svg" },
];

export default function SendPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeNetwork, switchNetwork } = useNetwork();
  const { ready, loading: sysLoading } = useSystemReady();
  const scale = useScale();

  const {
    sendTransaction,
    sending,
    gasFee,
    adminFee,
    totalFee,
    feeLoading,
    feeError,
    calculateFees,
  } = useSend();

  const { balances, prices } = useBalance();

  // UI state management
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState("");

  // Derived configuration for fees and balance
  const cfg = NETWORKS[activeNetwork] || {};
  const { label: short, min, explorer } = cfg;
  const val = useMemo(() => parseFloat(amount) || 0, [amount]);
  const bal = useMemo(() => balances?.[activeNetwork] || 0, [balances, activeNetwork]);

  // Fiat conversions
  const eurBal = useMemo(() => {
    const rate = prices?.[activeNetwork]?.eur ?? 0;
    return (bal * rate).toFixed(2);
  }, [prices, activeNetwork, bal]);

  const usdBal = useMemo(() => {
    const rate = prices?.[activeNetwork]?.usd ?? 0;
    return (bal * rate).toFixed(2);
  }, [prices, activeNetwork, bal]);

  // Address validator
  const isValidAddress = useCallback(
    (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr.trim()),
    []
  );

  // Handle fees calculation
  useEffect(() => {
    if (val > 0) calculateFees(activeNetwork, val);
  }, [activeNetwork, val, calculateFees]);

  // Handle authentication flow
  useEffect(() => {
    if (ready && !user) {
      router.replace("/");
    }
  }, [ready, user, router]);

  // Show loading state while system is loading
  if (sysLoading) {
    return (
      <div className={styles.loader}>
        <MiniLoadingSpinner size={40} />
      </div>
    );
  }

  // Handle network switch
  const onNetworkSelect = useCallback(
    (sym) => {
      if (sym !== activeNetwork) {
        switchNetwork(sym);
        setReceiver("");
        setAmount("");
      }
    },
    [activeNetwork, switchNetwork]
  );

  // Handle send button click
  const onSendClick = useCallback(() => {
    if (!isValidAddress(receiver)) {
      alert("❌ Invalid address");
      return;
    }
    if (val < min) {
      alert(`❌ Minimum is ${min} ${short}`);
      return;
    }
    if (val + totalFee > bal) {
      alert("❌ Insufficient balance");
      return;
    }
    setConfirmOpen(true);
  }, [receiver, val, min, short, totalFee, bal, isValidAddress]);

  // Confirm transaction
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
    } catch (e) {
      setError(e.message || "Transaction failed");
    }
  }, [receiver, val, user, sendTransaction]);

  // Step-wise modal for sending process
  const onNextStep = () => setCurrentStep(currentStep + 1);
  const onPrevStep = () => setCurrentStep(currentStep - 1);

  return (
    <main className={styles.main} style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
      <div className={styles.wrapper}>
        {/* Network Selector */}
        <NetworkSelector onSelect={onNetworkSelect} />

        {/* Balance Info */}
        <div className={styles.balanceTable}>
          <p>
            Your Balance: <strong>{bal.toFixed(6)} {short}</strong>
          </p>
          <p>
            ≈ €{eurBal} | ≈ ${usdBal}
          </p>
        </div>

        {/* Step Modal for sending process */}
        {currentStep === 1 && <StepModal step={1} onNext={onNextStep} />}
        {currentStep === 2 && (
          <StepModal step={2} onPrev={onPrevStep} onNext={onNextStep} />
        )}
        {currentStep === 3 && (
          <StepModal step={3} onPrev={onPrevStep} onNext={onNextStep} />
        )}

        {/* Inputs and Fee Information */}
        <div className={styles.walletActions}>
          <input
            type="text"
            placeholder="Receiver Address"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className={styles.inputField}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
          />
          <div className={styles.feesInfo}>
            {feeLoading ? (
              <p>Calculating fees...</p>
            ) : (
              <p>Total Fee: {(val + totalFee).toFixed(6)} {short}</p>
            )}
          </div>
          <button onClick={onSendClick} className={styles.sendNowButton}>
            Send Now
          </button>
        </div>

        {/* Confirm Modal */}
        {confirmOpen && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <h3>Confirm Transaction</h3>
              <p>To: {receiver}</p>
              <p>Amount: {val} {short}</p>
              <p>Total Fee: {totalFee} {short}</p>
              <button onClick={onConfirm}>Confirm</button>
            </div>
          </div>
        )}

        {/* Success and Error Modals */}
        {successOpen && (
          <SuccessModal txHash={txHash} explorerUrl={`${explorer}${txHash}`} />
        )}
        {error && <ErrorModal error={error} />}
      </div>
    </main>
  );
        }
