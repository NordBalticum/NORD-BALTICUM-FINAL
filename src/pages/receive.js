"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { supabase } from "@/utils/supabaseClient";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import ReceiveSuccessModal from "@/components/modals/ReceiveSuccessModal";
import styles from "@/styles/receive.module.css";
import background from "@/styles/background.module.css";

export default function Receive() {
  const router = useRouter();
  const { user, wallet, loading } = useAuth();

  const [isClient, setIsClient] = useState(false);
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [receivedNetwork, setReceivedNetwork] = useState("");
  const [receivedTxHash, setReceivedTxHash] = useState("");

  const playReceiveSound = () => {
    const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3");
    audio.play();
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
      requestNotificationPermission(); // Paprašom leidimo iškart
    }
  }, []);

  useEffect(() => {
    if (isClient && !loading && !user) {
      router.replace("/");
    }
  }, [user, loading, isClient, router]);

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
    if (!wallet?.wallet?.address) return;

    // Real-Time Receive Monitoring
    const subscription = supabase
      .channel('realtime:transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        const { new: tx } = payload;
        if (tx?.receiver_address?.toLowerCase() === wallet.wallet.address.toLowerCase()) {
          console.log("✅ New Incoming Transaction Received:", tx);

          playReceiveSound();

          // Modal info
          setReceivedAmount(tx.amount);
          setReceivedNetwork(tx.network);
          setReceivedTxHash(tx.tx_hash);
          setModalOpen(true);

          // Bounce Toast
          toast.success(
            (t) => (
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
            ),
            {
              style: {
                background: "#0a0a0a",
                color: "#fff",
                border: "2px solid #00FF00",
                animation: "bounce 0.5s ease",
              },
              iconTheme: {
                primary: "#00FF00",
                secondary: "#0a0a0a",
              },
            }
          );

          // Desktop notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Received Crypto", {
              body: `+${tx.amount} ${tx.network.toUpperCase()} received!`,
              icon: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png", // ar kitą ikoną
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [wallet]);

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

  if (!isClient || loading) {
    return <div className={styles.loadingScreen}>Loading Wallet...</div>;
  }

  const address = wallet?.wallet?.address;

  if (!user || !address) {
    return <div className={styles.loadingScreen}>Preparing wallet...</div>;
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
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
        >
          <h1 className={styles.title}>RECEIVE</h1>
          <p className={styles.subtext}>Your MultiNetwork Receiving Address</p>

          {/* ✅ QR Code */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={styles.qrWrapper}
            onClick={() => handleCopy(address)}
          >
            <QRCode
              value={address}
              size={180}
              bgColor="transparent"
              fgColor="#ffffff"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </motion.div>

          {/* ✅ Wallet Address */}
          <p className={styles.addressText}>
            {address}
          </p>

          {/* ✅ Copy Button */}
          <motion.button
            onClick={() => handleCopy(address)}
            className={styles.copyButton}
            whileHover={{ scale: 1.05 }}
          >
            {copied ? "Copied!" : "Copy Address"}
          </motion.button>

          {/* ✅ Small Copied Success */}
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
