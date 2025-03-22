import { useMagicLink } from "../contexts/MagicLinkContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Wallet,
  JsonRpcProvider,
  parseEther,
  formatEther
} from "ethers";

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
      provider.getBalance(wallet.address).then((bal) => {
        setBalance(formatEther(bal));
      });
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

      const currentBalance = await provider.getBalance(sender.address);
      if (currentBalance < totalAmount + 21000n * 2n * 1000000000n) {
        throw new Error("Insufficient balance to cover amount and gas.");
      }

      const tx1 = await sender.sendTransaction({
        to,
        value: sendAmount,
        gasLimit: 21000,
      });

      const tx2 = await sender.sendTransaction({
        to: adminWallet,
        value: feeAmount,
        gasLimit: 21000,
      });

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
      <div className="contentWrapper glassBox">
        <h2 className="fadeIn">Send Crypto</h2>
        <p>Email: <strong>{user.email}</strong></p>
        <p>Wallet: {wallet.address}</p>

        <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
          <button
            onClick={() => setNetwork("bsc")}
            style={{
              padding: "10px 16px",
              background: network === "bsc" ? "#ffffff" : "#111",
              color: network === "bsc" ? "#000" : "#fff",
              border: "2px solid white",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Mainnet
          </button>
          <button
            onClick={() => setNetwork("bscTestnet")}
            style={{
              padding: "10px 16px",
              background: network === "bscTestnet" ? "#ffffff" : "#111",
              color: network === "bscTestnet" ? "#000" : "#fff",
              border: "2px solid white",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Testnet
          </button>
        </div>

        <p style={{ marginTop: "1rem" }}>
          Balance: {balance !== null ? `${balance} BNB` : "Loading..."}
        </p>

        <form onSubmit={handleSend} style={{ marginTop: "1rem", width: "100%", maxWidth: "400px" }}>
          <input
            type="text"
            placeholder="Recipient address"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Amount (BNB)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </button>
        </form>

        <p style={{ marginTop: "1rem", color: success ? "lightgreen" : "crimson" }}>
          {message}
        </p>
      </div>
    </div>
  );
}
