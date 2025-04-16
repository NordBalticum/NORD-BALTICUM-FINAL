// src/app/receive.js
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMinimalReady } from "@/hooks/useMinimalReady";
import ReceiveSuccessModal from "@/components/modals/ReceiveSuccessModal";
import styles from "@/styles/receive.module.css";
import background from "@/styles/background.module.css";

export default function Receive() {
  const router = useRouter();
  const { wallet } = useAuth();
  const { ready, loading: minimalLoading } = useMinimalReady();

  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [receivedNetwork, setReceivedNetwork] = useState("");
  const [receivedTxHash, setReceivedTxHash] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const audioRef = useRef(null);

  const playReceiveSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3");
    }
    audioRef.current.play();
  };

  const getExplorerUrl = (network, txHash) => {
    switch (network) {
      case "bsc":
        return `https://bscscan.com/tx/${txHash}`;
      case "bsc_testnet":
        return `https://testnet.bscscan.com/tx/${txHash}`;
      case "eth":
        return `https://etherscan.io/tx/${txHash}`;
      case "polygon":
        return `https://polygonscan.com/tx/${txHash}`;
      case "avax":
        return `https://snowtrace.io/tx/${txHash}`;
      default:
        return "#";
    }
  };

  const handleCopy = async (address) => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard error:", err);
    }
  };

  useEffect(() => {
    if (!wallet?.wallet?.address || subscribed || !ready) return;

    const subscription = supabase
      .channel("realtime:transactions")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "transactions",
      }, (payload) => {
        const { new: tx } = payload;
        if (tx?.receiver_address?.toLowerCase() === wallet.wallet.address.toLowerCase()) {
          playReceiveSound();
          setReceivedAmount(tx.amount);
          setReceivedNetwork(tx.network);
          setReceivedTxHash(tx.tx_hash);
          setModalOpen(true);

          toast.success(() => (
            <span>
              +{tx.amount} {tx.network.toUpperCase()} received!
              <br />
              <a
                href={getExplorerUrl(tx.network, tx.tx_hash)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#00FF00", textDecoration: "underline", fontSize: "0.85rem" }}
              >
                View on Explorer
              </a>
            </span>
          ), {
            style: {
              background: "#0a0a0a",
              color: "#fff",
              border: "2px solid #00FF00",
            },
            iconTheme: {
              primary: "#00FF00",
              secondary: "#0a0a0a",
            },
          });

          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Received Crypto", {
              body: `+${tx.amount} ${tx.network.toUpperCase()} received!`,
              icon: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
            });
          }
        }
      })
      .subscribe();

    setSubscribed(true);
    return () => supabase.removeChannel(subscription);
  }, [wallet, subscribed, ready]);

  const address = wallet?.wallet?.address;

  if (!ready || !address) {
    return (
      <div className={styles.loadingScreen}>
        <motion.div
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Preparing Wallet...
        </motion.div>
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className={`${styles.main} ${background.gradient}`}
    >
      <ReceiveSuccessModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        amount={receivedAmount}
        network={receivedNetwork}
      />

      <div className={styles.globalContainer}>
        <motion.div
          className={styles.wrapper}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            padding: "2rem",
            width: "100%",
            maxWidth: "480px",
          }}
        >
          <h1 className={styles.title}>RECEIVE</h1>
          <p className={styles.subtext}>Your Multinetwork Receiving Address</p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className={styles.qrWrapper}
            onClick={() => handleCopy(address)}
            style={{
              padding: "1rem",
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.02)",
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
              cursor: "pointer",
            }}
          >
            <QRCode
              value={address}
              size={180}
              bgColor="transparent"
              fgColor="#ffffff"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </motion.div>

          <p className={styles.addressText}>{address}</p>

          <motion.button
            onClick={() => handleCopy(address)}
            className={styles.copyButton}
            whileHover={{ scale: 1.05 }}
          >
            {copied ? "Copied!" : "Copy Address"}
          </motion.button>

          {copied && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={styles.copied}
            >
              ✅ Wallet Address Copied
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.main>
  );
}
