import { useMagicLink } from "../contexts/MagicLinkContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { JsonRpcProvider } from "ethers";

export default function Dashboard() {
  const { user, wallet, signOut } = useMagicLink();
  const router = useRouter();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push("/");
    } else if (wallet) {
      const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC);
      provider.getBalance(wallet.address).then((bal) => {
        setBalance(ethers.formatEther(bal));
      });
    }
  }, [user, wallet]);

  if (!user || !wallet) return null;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Welcome, {user.email}</h1>
      <h2>Wallet Address: {wallet.address}</h2>
      <h3>Balance: {balance !== null ? `${balance} BNB` : "Loading..."}</h3>
      <button onClick={signOut} style={{ marginTop: "1rem", padding: "10px" }}>
        Sign Out
      </button>
    </div>
  );
}
