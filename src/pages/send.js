"use client";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Wallet, JsonRpcProvider, parseEther, formatEther } from "ethers";
import styles from "@/styles/send.module.css";

export default function Send() {
  const { user, wallet } = useMagicLink();
  const router = useRouter();

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState("bsc");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const rpcUrls = {
    bsc: process.env.NEXT_PUBLIC_BSC_RPC,
    bscTestnet: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
  };

  const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET;

  useEffect(() => {
    if (!user || !wallet) router.push("/");
  }, [user, wallet]);

  useEffect(() => {
    if (wallet && rpcUrls[network]) {
      const provider = new JsonRpcProvider(rpcUrls[network]);
      provider.getBalance(wallet.address)
        .then((bal) => setBalance(formatEther(bal)))
        .catch(() => setBalance("Error"));
    }
  }, [wallet, network]);

  const handleSend = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    setSuccess(false);

    try {
      if (!to || !amount || isNaN(Number(amount))) {
        throw new Error("Enter a valid recipient and amount.");
      }

      const provider = new JsonRpcProvider(rpcUrls[network]);
      const sender = new Wallet(wallet.private_key, provider);

      const totalAmount = parseEther(amount);
      const feeAmount = (totalAmount * BigInt(3)) / BigInt(100);
      const sendAmount = totalAmount - feeAmount;

      const gasLimit = 21000n;
      const gasPrice = await provider.getGasPrice();
      const totalFee = gasLimit * gasPrice * 2n;

      const currentBalance = await provider.getBalance(sender.address);
      if (currentBalance < totalAmount + totalFee) {
        throw new Error("Insufficient balance to cover amount and gas.");
      }

      const tx1 = await sender.sendTransaction({ to, value: sendAmount, gasLimit });
      const tx2 = await sender.sendTransaction({ to: adminWallet, value: feeAmount, gasLimit });

      await tx1.wait();
      await tx2.wait();

      const updatedBalance = await provider.getBalance(sender.address);
      setBalance(formatEther(updatedBalance));

      setSuccess(true);
      setMessage("✅ Transaction sent with 3% admin fee.");
      setAmount("");
      setTo("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !wallet) return null;

  return (
    <div className="globalContainer">
      <div className={`contentWrapper glassBox fadeIn ${styles.sendWrapper}`}>
        <h2 className={styles.title}>Send Crypto</h2>

        <p className={styles.label}>Email: <strong>{user.email}</strong></p>
        <p className={styles.label}>Wallet: {wallet.address}</p>

        <div className={styles.networkButtons}>
          <button
            onClick={() => setNetwork("bsc")}
            className={`${styles.netButton} ${network === "bsc" ? styles.active : ""}`}
          >
            Mainnet
          </button>
          <button
            onClick={() => setNetwork("bscTestnet")}
            className={`${styles.netButton} ${network === "bscTestnet" ? styles.active : ""}`}
          >
            Testnet
          </button>
        </div>

        <p className={styles.balance}>
          Balance: {balance !== null ? `${balance} BNB` : "Loading..."}
        </p>

        <form onSubmit={handleSend} className={styles.form}>
          <input
            type="text"
            placeholder="Recipient address"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          />
          <input
            type="number"
            step="any"
            min="0"
            placeholder="Amount (BNB)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </button>
        </form>

        <p className={success ? styles.success : styles.error}>
          {message}
        </p>
      </div>
    </div>
  );
}
