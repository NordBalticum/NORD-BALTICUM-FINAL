// src/app/send.js
"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSend } from "@/contexts/SendContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";

import dynamic from "next/dynamic";
const SuccessModal = dynamic(() => import("@/components/modals/SuccessModal"));
const ErrorModal   = dynamic(() => import("@/components/modals/ErrorModal"));

import SwipeSelector from "@/components/SwipeSelector";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SuccessToast from "@/components/SuccessToast";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

const NETWORKS = {
  eth:   { label:"ETH",   min:0.001,  color:"#0072ff", explorer:"https://etherscan.io/tx/" },
  bnb:   { label:"BNB",   min:0.0005, color:"#f0b90b", explorer:"https://bscscan.com/tx/" },
  tbnb:  { label:"tBNB",  min:0.0005, color:"#f0b90b", explorer:"https://testnet.bscscan.com/tx/" },
  matic: { label:"MATIC", min:0.1,    color:"#8247e5", explorer:"https://polygonscan.com/tx/" },
  avax:  { label:"AVAX",  min:0.01,   color:"#e84142", explorer:"https://snowtrace.io/tx/" },
};

export default function SendPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeNetwork, switchNetwork } = useNetwork();
  const { ready, loading: sysLoading } = useSystemReady();

  const {
    sendTransaction, sending, gasFee, adminFee, totalFee,
    feeLoading, feeError, calculateFees
  } = useSend();

  const { balances, getUsdBalance, getEurBalance } = useBalance();

  const [receiver, setReceiver]       = useState("");
  const [amount, setAmount]           = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [toast, setToast]             = useState({ show:false, msg:"" });
  const [error, setError]             = useState(null);
  const [txHash, setTxHash]           = useState("");

  // derive network info
  const cfg    = useMemo(() => NETWORKS[activeNetwork] || {}, [activeNetwork]);
  const { label: short, min, color: btnClr, explorer } = cfg;
  const val    = useMemo(() => parseFloat(amount) || 0, [amount]);
  const bal    = balances?.[activeNetwork] || 0;
  const eurBal = getEurBalance?.(activeNetwork) || "0.00";
  const usdBal = getUsdBalance?.(activeNetwork) || "0.00";

  const isValidAddress = useCallback(
    adr => /^0x[a-fA-F0-9]{40}$/.test(adr.trim()),
    []
  );

  // recalc fees (debounced)
  useEffect(() => {
    if (val > 0) calculateFees(activeNetwork, val);
  }, [activeNetwork, val, calculateFees]);

  // redirect if not authed
  useEffect(() => {
    if (ready && !user) router.replace("/");
  }, [user, ready, router]);

  if (sysLoading) {
    return (
      <div className={styles.loader}><MiniLoadingSpinner size={40} /></div>
    );
  }

  const switchNet = useCallback(net => {
    switchNetwork(net);
    setReceiver("");
    setAmount("");
    setToast({ show:true, msg:`Switched to ${NETWORKS[net].label}` });
    navigator.vibrate?.(30);
    setTimeout(() => setToast({ show:false,msg:"" }), 1200);
  }, [switchNetwork]);

  const onSendClick = useCallback(() => {
    if (!isValidAddress(receiver)) return alert("❌ Invalid address");
    if (val < min)                  return alert(`❌ Min is ${min} ${short}`);
    if (val + totalFee > bal)       return alert("❌ Insufficient funds");
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

  return (
    <main className={`${styles.main} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <SuccessToast show={toast.show} message={toast.msg} networkKey={activeNetwork} />

        <SwipeSelector selected={activeNetwork} onSelect={switchNet} />

        <div className={styles.balanceTable}>
          <p>Your Balance: <strong>{bal.toFixed(6)} {short}</strong></p>
          <p>≈ €{eurBal} | ≈ ${usdBal}</p>
        </div>

        <div className={styles.walletActions}>
          <input
            type="text"
            aria-label="Receiver address"
            placeholder="0x..."
            value={receiver}
            onChange={e => setReceiver(e.target.value)}
            disabled={sending}
            className={styles.inputField}
          />
          <input
            type="number"
            aria-label="Amount to send"
            placeholder="0.0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={sending}
            className={styles.inputField}
            min="0"
          />

          <div className={styles.feesInfo}>
            {feeLoading ? (
              <p><MiniLoadingSpinner size={14} /> Calculating…</p>
            ) : feeError ? (
              <p style={{color:"red"}}>Fee error: {feeError}</p>
            ) : (
              <>
                <p>Total: {(val + totalFee).toFixed(6)} {short}</p>
                <p>Min: {min} {short}</p>
              </>
            )}
          </div>

          <button
            onClick={onSendClick}
            disabled={!receiver||sending||feeLoading}
            aria-busy={sending}
            className={styles.sendButton}
            style={{
              backgroundColor: btnClr,
              color: (activeNetwork==="bnb"||activeNetwork==="tbnb")?"#000":"#fff",
            }}
          >
            {sending
              ? <MiniLoadingSpinner size={20} color="#fff" />
              : "SEND NOW"
            }
          </button>
        </div>

        {confirmOpen && (
          <div className={styles.overlay} onKeyDown={e=>e.key==="Escape"&&setConfirmOpen(false)}>
            <div className={styles.confirmModal} role="dialog" aria-modal="true">
              <h3>Confirm Transaction</h3>
              <p><b>Network:</b> {short}</p>
              <p><b>To:</b> {receiver}</p>
              <p><b>Amount:</b> {val.toFixed(6)} {short}</p>
              <p><b>Gas Fee:</b> {gasFee.toFixed(6)} {short}</p>
              <p><b>Admin Fee:</b> {adminFee.toFixed(6)} {short}</p>
              <p><b>Total:</b> {(val + totalFee).toFixed(6)} {short}</p>
              <div className={styles.modalActions}>
                <button onClick={onConfirm} disabled={sending}>
                  {sending ? "Processing…" : "Confirm"}
                </button>
                <button onClick={() => setConfirmOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {successOpen && txHash && (
          <SuccessModal
            message="✅ Transaction Sent!"
            transactionHash={txHash}
            explorerUrl={`${explorer}${txHash}`}
            onClose={() => setSuccessOpen(false)}
          />
        )}
        {error && <ErrorModal error={error} onClose={() => setError(null)} />}
      </div>
    </main>
  );
}
