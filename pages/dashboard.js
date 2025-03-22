import { useMagicLink } from "../contexts/MagicLinkContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { JsonRpcProvider, formatEther } from "ethers";

export default function Dashboard() {
  const { user, wallet, signOut } = useMagicLink();
  const router = useRouter();

  const [selectedNetwork, setSelectedNetwork] = useState("bsc");
  const [balance, setBalance] = useState(null);

  const rpcUrls = {
    bsc: process.env.NEXT_PUBLIC_BSC_RPC,
    bscTestnet: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC,
  };

  // Saugiai tikrinam user ir wallet
  useEffect(() => {
    if (!user) router.push("/");
  }, [user]);

  // Kai pasikeičia network arba wallet – atnaujinam balansą
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

      <button
        onClick={signOut}
        style={{ marginTop: "2rem", padding: "10px 20px" }}
      >
        Sign Out
      </button>
    </div>
  );
}
