import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { JsonRpcProvider, formatEther } from "ethers";
import Link from "next/link";

export default function Dashboard() {
  const { user, wallet, signOut } = useMagicLink();
  const router = useRouter();
  const currentPath = router.pathname;

  const [selectedNetwork, setSelectedNetwork] = useState("bsc");
  const [balance, setBalance] = useState(null);

  const rpcUrls = {
    bsc: process.env.NEXT_PUBLIC_BSC_RPC,
    bscTestnet: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
  };

  useEffect(() => {
    if (!user || !wallet) {
      router.push("/");
    }
  }, [user, wallet]);

  useEffect(() => {
    if (wallet && rpcUrls[selectedNetwork]) {
      const provider = new JsonRpcProvider(rpcUrls[selectedNetwork]);
      provider.getBalance(wallet.address).then((bal) => {
        setBalance(formatEther(bal));
      });
    }
  }, [wallet, selectedNetwork]);

  if (!user || !wallet) return null;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Welcome, {user.email}</h1>

      <div style={{ marginTop: "1.5rem" }}>
        <strong>Wallet address:</strong>
        <p>{wallet.address}</p>

        <label style={{ display: "block", marginTop: "1rem" }}>
          Select network:
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            <option value="bsc">BSC Mainnet</option>
            <option value="bscTestnet">BSC Testnet</option>
          </select>
        </label>

        <h3 style={{ marginTop: "1.5rem" }}>
          Balance: {balance !== null ? `${balance} BNB` : "Loading..."}
        </h3>
      </div>

      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <Link href="/send">
          <button
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              background: currentPath === "/send" ? "#fff" : "#111",
              color: currentPath === "/send" ? "#000" : "#fff",
              border: "2px solid white",
              cursor: "pointer",
            }}
          >
            📤 Send
          </button>
        </Link>

        <Link href="/receive">
          <button
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              background: currentPath === "/receive" ? "#fff" : "#111",
              color: currentPath === "/receive" ? "#000" : "#fff",
              border: "2px solid white",
              cursor: "pointer",
            }}
          >
            📥 Receive
          </button>
        </Link>
      </div>

      <button
        onClick={signOut}
        style={{
          marginTop: "2rem",
          padding: "10px 20px",
          borderRadius: "8px",
          border: "2px solid red",
          background: "#111",
          color: "white",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
