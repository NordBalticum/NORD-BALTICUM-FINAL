"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import Navbar from "@/components/Navbar";
import styles from "@/styles/dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet, supabase } = useMagicLink();

  const [selectedNetwork, setSelectedNetwork] = useState("bscTestnet");
  const [balance, setBalance] = useState("0.0000");
  const [rawBalance, setRawBalance] = useState("0");
  const [loading, setLoading] = useState(true);

  // ✅ Redirect jei nėra user arba wallet
  useEffect(() => {
    if (!user || !wallet) {
      const timeout = setTimeout(() => router.push("/"), 1000);
      return () => clearTimeout(timeout);
    }
  }, [user, wallet, router]);

  // ✅ Pasiima balanso info iš Supabase `balances` lentelės
  const fetchBalanceFromSupabase = async () => {
    if (!user?.id || !selectedNetwork) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("balances")
        .select("balance_formatted, balance_raw")
        .eq("user_id", user.id)
        .eq("network", selectedNetwork)
        .single();

      if (error) throw error;

      setBalance(data.balance_formatted || "0.0000");
      setRawBalance(data.balance_raw || "0");
    } catch (err) {
      console.error("❌ Supabase balance fetch error:", err.message);
      setBalance("0.0000");
      setRawBalance("0");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Pradinis fetch ir kaskart keičiant network
  useEffect(() => {
    fetchBalanceFromSupabase();
    const interval = setInterval(fetchBalanceFromSupabase, 6000);
    return () => clearInterval(interval);
  }, [selectedNetwork, user?.id]);

  if (!user || !wallet) {
    return (
      <div className={styles.loading}>
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="fullscreenContainer">
      <Navbar />
      <div className={styles.wrapper}>
        <h1 className={styles.welcome}>
          Welcome,<br />
          {user.email}
        </h1>

        <section className={styles.card}>
          <label className={styles.label}>Wallet address:</label>
          <p className={styles.address}>{wallet.address}</p>

          <div className={styles.networkSelector}>
            <label className={styles.label}>Select network:</label>
            <select
              className={styles.select}
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
            >
              <option value="bsc">BSC Mainnet</option>
              <option value="bscTestnet">BSC Testnet</option>
            </select>
          </div>

          <div className={styles.balanceBox}>
            <span className={styles.balanceLabel}>Balance:</span>
            <span className={styles.balanceValue}>
              {loading ? "Loading..." : `${balance} BNB`}
            </span>
          </div>

          <div className={styles.rawInfo}>
            <span className={styles.rawLabel}>Raw:</span>
            <span className={styles.rawValue}>{rawBalance}</span>
          </div>
        </section>

        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={() => router.push("/send")}
          >
            🧾 SEND
          </button>
          <button
            className={styles.actionButton}
            onClick={() => router.push("/receive")}
          >
            ✅ RECEIVE
          </button>
        </div>
      </div>
    </div>
  );
}
