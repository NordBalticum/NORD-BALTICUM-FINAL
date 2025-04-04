"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { JsonRpcProvider, Wallet, parseEther } from "ethers";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalances } from "@/contexts/BalanceContext";
import SwipeSelector from "@/components/SwipeSelector";

import styles from "@/styles/send.module.css"; // <- tavo CSS importuotas tvarkingai!

const RPC = {
  eth: "https://rpc.ankr.com/eth",
  bnb: "https://bsc-dataseed.binance.org/",
  tbnb: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  matic: "https://polygon-rpc.com",
  avax: "https://api.avax.network/ext/bc/C/rpc",
};

export default function Send() {
  const router = useRouter();
  const { user } = useMagicLink();
  const { wallet, activeNetwork, setActiveNetwork } = useWallet();
  const { balance, refreshBalance } = useBalances();

  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [toast, setToast] = useState("");

  // Užtikrinam, kad komponentas veikia tik klientinėje pusėje
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (isClient && !user) {
      router.replace("/");
    }
  }, [user, isClient, router]);

  const sendCrypto = useCallback(async () => {
    if (!receiver || !amount || !activeNetwork) {
      alert("Fill in all fields.");
      return;
    }

    setSending(true);

    try {
      if (typeof window === "undefined") throw new Error("Window is not available.");

      const stored = localStorage.getItem("userPrivateKey");
      if (!stored) throw new Error("Private key missing.");
      const { key } = JSON.parse(stored);

      const provider = new JsonRpcProvider(RPC[activeNetwork]);
      const signer = new Wallet(key, provider);

      const fullAmount = parseEther(amount);
      const fee = fullAmount.mul(3).div(100);
      const amountAfterFee = fullAmount.sub(fee);

      const tx1 = await signer.sendTransaction({
        to: receiver.trim(),
        value: amountAfterFee,
        gasLimit: 21000,
      });

      const tx2 = await signer.sendTransaction({
        to: process.env.NEXT_PUBLIC_ADMIN_WALLET,
        value: fee,
        gasLimit: 21000,
      });

      if (user?.email && activeNetwork) {
        await refreshBalance(user.email, activeNetwork);
      }

      setToast("✅ Transaction sent successfully!");
      setTimeout(() => setToast(""), 5000); // 5 sek automatinis išjungimas

      setReceiver("");
      setAmount("");
    } catch (err) {
      console.error(err);
      alert(err.message || "Sending failed");
    } finally {
      setSending(false);
    }
  }, [receiver, amount, activeNetwork, user, refreshBalance]);

  if (!isClient) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Send Crypto</h1>
      <SwipeSelector mode="send" onSelect={setActiveNetwork} />

      <div className={styles.inputGroup}>
        <input
          type="text"
          placeholder="Receiver Address"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.inputGroup}>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.buttonWrapper}>
        <button
          onClick={sendCrypto}
          disabled={sending}
          className={styles.sendButton}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>

      {toast && <p className={styles.toast}>{toast}</p>}
    </div>
  );
      }
