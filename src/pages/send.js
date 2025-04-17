"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useSend } from "@/contexts/SendContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";

import SwipeSelector from "@/components/SwipeSelector";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SuccessModal from "@/components/modals/SuccessModal";
import ErrorModal from "@/components/modals/ErrorModal";
import SuccessToast from "@/components/SuccessToast";

import styles from "@/styles/send.module.css";
import background from "@/styles/background.module.css";

// network metadata
const NETWORKS = {
  eth:   { label:"ETH",   min:0.001,  color:"#0072ff" },
  bnb:   { label:"BNB",   min:0.0005, color:"#f0b90b" },
  tbnb:  { label:"tBNB",  min:0.0005, color:"#f0b90b" },
  matic: { label:"MATIC", min:0.1,    color:"#8247e5" },
  avax:  { label:"AVAX",  min:0.01,   color:"#e84142" },
};

export default function SendPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeNetwork, switchNetwork } = useNetwork();
  const { ready, loading: sysLoading } = useSystemReady();

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

  const { balances, getUsdBalance, getEurBalance } = useBalance();

  const [receiver, setReceiver]     = useState("");
  const [amount, setAmount]         = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [toast, setToast]           = useState({ show:false, msg:"" });
  const [error, setError]           = useState(null);
  const [txHash, setTxHash]         = useState("");

  // derive network info
  const cfg     = NETWORKS[activeNetwork] || {};
  const short   = cfg.label || activeNetwork.toUpperCase();
  const minAmt  = cfg.min   || 0;
  const btnClr  = cfg.color || "#888";
  const val     = parseFloat(amount)||0;
  const bal     = balances?.[activeNetwork]||0;
  const eurBal  = getEurBalance?.(activeNetwork)||"0.00";
  const usdBal  = getUsdBalance?.(activeNetwork)||"0.00";

  // address validator
  const isValidAddress = adr => /^0x[a-fA-F0-9]{40}$/.test(adr.trim());

  // recalc fees
  useEffect(() => {
    if (val>0) calculateFees(activeNetwork,val);
  }, [activeNetwork,val,calculateFees]);

  // guard: not authed → back
  useEffect(() => {
    if (!user) router.replace("/");
  }, [user,router]);

  // guard: system not ready → spinner
  if (sysLoading || !ready) {
    return <div className={styles.loader}><MiniLoadingSpinner /></div>;
  }

  const switchNet = n => {
    switchNetwork(n);
    setReceiver(""); setAmount("");
    setToast({ show:true, msg:`Switched to ${NETWORKS[n].label}` });
    navigator.vibrate?.(30);
    setTimeout(()=>setToast({ show:false,msg:""}),1200);
  };

  const onSendClick = () => {
    if (!isValidAddress(receiver)) return alert("❌ Invalid address");
    if (val < minAmt)                  return alert(`❌ Minimum is ${minAmt} ${short}`);
    if (val + totalFee > bal)          return alert("❌ Insufficient balance");
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    setConfirmOpen(false);
    setError(null);
    try {
      const hash = await sendTransaction({
        to: receiver.trim().toLowerCase(),
        amount: val,
        userEmail: user.email,
      });
      setTxHash(hash);
      setReceiver(""); setAmount("");
      setSuccessOpen(true);
      navigator.vibrate?.(80);
    } catch (e) {
      setError(e.message||"Transaction failed");
    }
  };

  return (
    <main className={`${styles.main} ${background.gradient}`}>
      <div className={styles.wrapper}>
        <SuccessToast show={toast.show} message={toast.msg} networkKey={activeNetwork} />

        {/* network switcher */}
        <SwipeSelector selected={activeNetwork} onSelect={switchNet} />

        {/* balances */}
        <div className={styles.balanceTable}>
          <p>Your Balance: <strong>{bal.toFixed(6)} {short}</strong></p>
          <p>≈ €{eurBal} | ≈ ${usdBal}</p>
        </div>

        {/* inputs & fees */}
        <div className={styles.walletActions}>
          <input
            type="text" placeholder="Receiver address"
            value={receiver} onChange={e=>setReceiver(e.target.value)}
            disabled={sending} className={styles.inputField}
          />
          <input
            type="number" placeholder="Amount"
            value={amount} onChange={e=>setAmount(e.target.value)}
            disabled={sending} className={styles.inputField} min="0"
          />

          <div className={styles.feesInfo}>
            {feeLoading
              ? <p><MiniLoadingSpinner size={14}/> Calculating fees…</p>
              : feeError
                ? <p style={{color:"red"}}>Fee error: {feeError}</p>
                : <>
                    <p>Total: {(val+totalFee).toFixed(6)} {short}</p>
                    <p>Min: {minAmt} {short}</p>
                  </>
            }
          </div>

          <button
            onClick={onSendClick}
            disabled={!receiver||sending||feeLoading}
            style={{
              backgroundColor: btnClr,
              color: (activeNetwork==="bnb"||activeNetwork==="tbnb")?"#000":"#fff",
              border:"2px solid #fff",
              padding:"12px 0", fontSize:"18px",
              width:"100%", marginTop:"16px",
              borderRadius:"12px",
              boxShadow:"0 8px 24px rgba(0,0,0,0.2)"
            }}
          >
            {sending
              ? <MiniLoadingSpinner size={20} color="#fff"/>
              : "SEND NOW"
            }
          </button>
        </div>

        {/* confirm modal */}
        {confirmOpen && (
          <div className={styles.overlay}>
            <div className={styles.confirmModal}>
              <h3>Confirm Transaction</h3>
              <p><b>Network:</b> {short}</p>
              <p><b>To:</b> {receiver}</p>
              <p><b>Amount:</b> {val.toFixed(6)} {short}</p>
              <p><b>Gas Fee:</b> {gasFee.toFixed(6)} {short}</p>
              <p><b>Admin Fee:</b> {adminFee.toFixed(6)} {short}</p>
              <p><b>Total:</b> {(val+totalFee).toFixed(6)} {short}</p>
              <div className={styles.modalActions}>
                <button onClick={onConfirm} disabled={sending}>
                  {sending ? "Sending…" : "Confirm"}
                </button>
                <button onClick={()=>setConfirmOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* success & error */}
        {successOpen && txHash && (
          <SuccessModal
            message="✅ Transaction Sent!"
            transactionHash={txHash}
            network={activeNetwork}
            onClose={()=>setSuccessOpen(false)}
          />
        )}
        {error && (
          <ErrorModal error={error} onClose={()=>setError(null)} />
        )}
      </div>
    </main>
  );
}
