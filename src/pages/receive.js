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

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || !wallet) return null;

  return (
    <div className="globalContainer">
      <div className="contentWrapper glassBox">
        <h2 className="fadeIn">Receive Crypto</h2>
        <p>Email: <strong>{user.email}</strong></p>
        <p>Wallet address:</p>

        <div onClick={handleCopy} style={{ cursor: "pointer", marginBottom: "1rem" }}>
          <QRCode value={wallet.address} size={180} bgColor="#ffffff" fgColor="#000000" />
          <p style={{ wordBreak: "break-all", marginTop: "1rem" }}>{wallet.address}</p>
          <small>{copied ? "Copied!" : "Tap QR to copy address"}</small>
        </div>

        <label style={{ marginTop: "1rem" }}>
          Select network:
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
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
    </div>
  );
}
