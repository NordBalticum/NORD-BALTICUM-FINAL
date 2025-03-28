"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ethers } from "ethers";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";

import BottomNavigation from "@/components/BottomNavigation";
import SuccessModal from "@/components/modals/SuccessModal";
import styles from "@/styles/swipe.module.css";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;

const networks = [
  {
    name: "BNB Smart Chain",
    symbol: "BNB",
    route: "/send/bnb",
    rpc: process.env.NEXT_PUBLIC_BSC_RPC,
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  },
  {
    name: "BSC Testnet",
    symbol: "TBNB",
    route: "/send/tbnb",
    rpc: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
    icon: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    route: "/send/eth",
    rpc: process.env.NEXT_PUBLIC_ETH_RPC,
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    name: "Polygon",
    symbol: "POL",
    route: "/send/pol",
    rpc: process.env.NEXT_PUBLIC_POLYGON_RPC,
    icon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
  {
    name: "Avalanche",
    symbol: "AVAX",
    route: "/send/avax",
    rpc: process.env.NEXT_PUBLIC_AVAX_RPC,
    icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  },
];

export default function Send() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { wallet } = useWallet();

  const [selected, setSelected] = useState(0);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!user || !wallet?.address) router.push("/");
  }, [user, wallet]);

  const handleSend = () => {
    if (!receiver || !amount) {
      alert("Please enter both the address and amount.");
      return;
    }
    setShowModal(true);
  };

  const confirmSend = async () => {
    setShowModal(false);
    const network = networks[selected];
    const provider = new ethers.JsonRpcProvider(network.rpc);

    try {
      const senderWallet = new ethers.Wallet(wallet.privateKey, provider);
      const value = ethers.parseEther(amount);
      const fee = value * BigInt(3) / BigInt(100); // 3% fee
      const netAmount = value - fee;

      const tx1 = await senderWallet.sendTransaction({
        to: receiver,
        value: netAmount,
      });

      const tx2 = await senderWallet.sendTransaction({
        to: ADMIN_WALLET,
        value: fee,
      });

      console.log("✅ User TX:", tx1.hash);
      console.log("✅ Admin Fee TX:", tx2.hash);
      setTimeout(() => setShowSuccess(true), 800);
    } catch (err) {
      console.error("❌ Transaction Error:", err);
      alert("Transaction failed. Please check your wallet and try again.");
    }
  };

  if (!user || !wallet?.address) {
    return <div className={styles.loading}>Loading Wallet...</div>;
  }

  return (
    <div className="globalContainer">
      <div className={styles.wrapper}>
        <h1 className={styles.title}>SEND CRYPTO</h1>
        <p className={styles.subtext}>Choose your network and enter details</p>

        <div className={styles.swipeWrapper}>
          {networks.map((net, index) => (
            <div
              key={net.symbol}
              className={`${styles.walletCard} ${selected === index ? styles.selected : ""}`}
              onClick={() => setSelected(index)}
            >
              <div className={styles.walletHeader}>
                <span className={styles.walletName}>{net.name}</span>
                <span className={styles.walletBalance}>0.0000 {net.symbol}</span>
              </div>
              <Image
                src={net.icon}
                alt={net.symbol}
                width={48}
                height={48}
                className={styles.icon}
                unoptimized
              />
            </div>
          ))}
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
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.inputField}
          />
          <p className={styles.feeInfo}>
            Estimated Fee: 3% ({Number(amount || 0) * 0.03} {networks[selected].symbol})
          </p>
          <button onClick={handleSend} className={styles.confirmButton}>
            SEND
          </button>
        </div>
      </div>

      {showModal && (
        <div className={styles.confirmModal}>
          <div className={styles.modalTitle}>Confirm Transaction</div>
          <div className={styles.modalInfo}>
            <p><strong>Network:</strong> {networks[selected].name}</p>
            <p><strong>To:</strong> {receiver}</p>
            <p><strong>Amount:</strong> {amount} {networks[selected].symbol}</p>
            <p><strong>Fee:</strong> 3% ({Number(amount || 0) * 0.03} {networks[selected].symbol})</p>
          </div>
          <div className={styles.modalActions}>
            <button className={styles.modalButton} onClick={confirmSend}>Confirm</button>
            <button className={`${styles.modalButton} ${styles.cancel}`} onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
      <BottomNavigation />
    </div>
  );
}
