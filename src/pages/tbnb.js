"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "react-qr-code";

import { useSystemReady } from "@/hooks/useSystemReady";
import { useScale } from "@/hooks/useScale";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSend } from "@/contexts/SendContext";

import MiniLoadingSpinner from "@/components/MiniLoadingSpinner";
import SendModal from "@/components/SendModal";

import styles from "@/styles/tbnb.module.css";

const BnbChartDynamic = dynamic(() => import("@/components/BnbChart"), {
  ssr: false,
  loading: () => <MiniLoadingSpinner />,
});

export default function TBnbPage() {
  const router = useRouter();
  const { user, wallet } = useAuth();
  const { balances, prices } = useBalance();
  const { ready, loading } = useSystemReady();
  const { sending } = useSend();
  const scale = useScale();

  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const address = wallet?.wallet?.address ?? "";

  useEffect(() => {
    if (ready && !wallet?.wallet?.address) {
      router.replace("/");
    }
  }, [ready, wallet, router]);

  const balance = useMemo(() => parseFloat(balances?.tbnb ?? 0), [balances]);
  const eurValue = useMemo(() => (balance * (prices?.tbnb?.eur ?? 0)).toFixed(2), [balance, prices]);
  const usdValue = useMemo(() => (balance * (prices?.tbnb?.usd ?? 0)).toFixed(2), [balance, prices]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !ready || sending) {
    return (
      <main className={styles.pageContainer}>
        <MiniLoadingSpinner />
      </main>
    );
  }

  return (
    <main className={styles.pageContainer}>
      <AnimatePresence mode="wait">
        <motion.div
          key="tbnb-content"
          className={styles.pageContent}
          initial={{ opacity: 0, scale, y: 20 }}
          animate={{ opacity: 1, scale, y: 0 }}
          exit={{ opacity: 0, scale, y: -20 }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Header */}
          <div className={styles.header}>
            <Image
              src="/icons/bnb.svg"
              alt="BNB Logo"
              width={60}
              height={60}
              className={styles.networkLogo}
              priority
            />
            <h1 className={styles.networkNameSmall}>Binance Smart Chain (Testnet)</h1>
            <div className={styles.balanceBox}>
              <p className={styles.balanceText}>{balance.toFixed(6)} BNB</p>
              <p className={styles.balanceFiat}>
                {eurValue} € | {usdValue} $
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className={styles.chartWrapper}>
            <div className={styles.chartBorder}>
              <div className={styles.chartInner}>
                <BnbChartDynamic />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button onClick={() => setShowSendModal(true)} className={styles.actionButton}>
              Send
            </button>
            <button onClick={() => setShowReceiveModal(true)} className={styles.actionButton}>
              Receive
            </button>
            <button onClick={() => router.push("/transactions")} className={styles.actionButton}>
              History
            </button>
          </div>

          {/* Send Modal */}
          {showSendModal && (
            <SendModal
              onClose={() => setShowSendModal(false)}
              network="tbnb"
              userEmail={user?.email}
            />
          )}

          {/* Receive Modal */}
          {showReceiveModal && (
            <div className={styles.receiveModalOverlay} onClick={() => setShowReceiveModal(false)}>
              <div className={styles.receiveModal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.modalTitle}>Receive BNB</h2>
                <div className={styles.qrContainer} onClick={handleCopy}>
                  <QRCode
                    value={address}
                    size={160}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                  <p className={styles.qrAddress}>{address}</p>
                  <p className={styles.qrCopy}>{copied ? "Copied!" : "Tap to copy address"}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
