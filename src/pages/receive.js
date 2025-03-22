"use client";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { JsonRpcProvider, formatEther } from "ethers";
import QRCode from "react-qr-code";

export default function Receive() {
  const { user, wallet } = useMagicLink();
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState("bsc");

  const rpcUrls = {
    bsc: process.env.NEXT_PUBLIC_BSC_RPC,
    bscTestnet: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
  };

  useEffect(() => {
    if (!user || !wallet) {
      const t = setTimeout(() => router.push("/"), 1200);
      return () => clearTimeout(t);
    }
  }, [user, wallet]);

  useEffect(() => {
    if (wallet && rpcUrls[network]) {
      const provider = new JsonRpcProvider(rpcUrls[network]);
      provider.getBalance(wallet.address).then((bal) => {
        setBalance(formatEther(bal));
      });
    }
  }, [wallet, network]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  if (!user || !wallet) return null;

  return (
    <div className="globalContainer">
      <div
        className="contentWrapper glassBox fadeIn"
        role="main"
        aria-label="Receive crypto interface"
        style={{
          maxWidth: "620px",
          width: "100%",
          textAlign: "center",
          padding: "clamp(1.2rem, 3vw, 2rem)",
          borderRadius: "18px",
          boxShadow: "0 0 30px rgba(0,255,204,0.05)",
        }}
      >
        <h2 style={{
          fontSize: "clamp(1.6rem, 2.2vw, 2.2rem)",
          marginBottom: "1.4rem",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          fontWeight: "700"
        }}>
          Receive Crypto
        </h2>

        <p style={{ fontSize: "0.95rem", color: "#ccc", marginBottom: "1rem" }}>
          Email: <strong>{user.email}</strong>
        </p>

        <div
          onClick={handleCopy}
          className="glassBox hoverable"
          aria-label="Tap to copy wallet address"
          style={{
            cursor: "pointer",
            padding: "1rem",
            borderRadius: "18px",
            marginBottom: "1.5rem",
            background: "rgba(255,255,255,0.06)",
            transition: "all 0.3s ease",
            boxShadow: copied ? "0 0 16px rgba(0,255,200,0.25)" : "none"
          }}
        >
          <QRCode
            value={wallet.address}
            size={180}
            bgColor="#ffffff"
            fgColor="#000000"
            style={{ borderRadius: "12px", margin: "0 auto" }}
          />
          <p
            style={{
              wordBreak: "break-all",
              marginTop: "1rem",
              fontSize: "clamp(0.85rem, 1vw, 1rem)",
              color: "#f0f0f0",
              fontWeight: "500"
            }}
          >
            {wallet.address}
          </p>
          <small
            style={{
              display: "block",
              marginTop: "0.5rem",
              color: copied ? "#00ffc8" : "#aaa",
              fontWeight: "500",
              fontSize: "0.85rem"
            }}
          >
            {copied ? "✓ Copied to clipboard!" : "Tap QR to copy address"}
          </small>
        </div>

        <div style={{
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.8rem"
        }}>
          <label htmlFor="network" style={{
            fontSize: "0.95rem",
            fontWeight: "600"
          }}>
            Network:
          </label>
          <select
            id="network"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            aria-label="Select blockchain network"
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              background: "#111",
              color: "#fff",
              fontWeight: "600",
              fontSize: "0.95rem",
              border: "2px solid white",
              boxShadow: "0 0 10px rgba(255,255,255,0.1)"
            }}
          >
            <option value="bsc">BSC Mainnet</option>
            <option value="bscTestnet">BSC Testnet</option>
          </select>
        </div>

        <h3 style={{
          marginTop: "1.2rem",
          fontSize: "1.15rem",
          fontWeight: "700",
          color: "#00ffc8",
          textShadow: "0 0 6px rgba(0,255,200,0.25)"
        }}>
          Balance: {balance !== null ? `${balance} BNB` : "Loading..."}
        </h3>
      </div>
    </div>
  );
}
