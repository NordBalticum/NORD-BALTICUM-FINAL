"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function BalanceComponent() {
  const { wallet, balances, refreshBalance, loading, activeNetwork } = useAuth();
  const [localBalance, setLocalBalance] = useState(0);

  useEffect(() => {
    if (!wallet?.signers?.[activeNetwork]) return;

    const fetchAndSetBalance = async () => {
      await refreshBalance(activeNetwork);
      setLocalBalance(balances[activeNetwork] || 0);
    };

    fetchAndSetBalance();

    const interval = setInterval(fetchAndSetBalance, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [wallet, activeNetwork, balances, refreshBalance]);

  if (loading || !activeNetwork) {
    return <div style={styles.loading}>Loading balance...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        {activeNetwork?.toUpperCase()} BALANCE
      </h2>

      <div style={styles.balanceBox}>
        <p style={styles.balance}>
          {localBalance.toFixed(6)} {activeNetwork.toUpperCase()}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px 20px",
    textAlign: "center",
    color: "white",
  },
  title: {
    fontSize: "22px",
    marginBottom: "14px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  balanceBox: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    padding: "20px",
    display: "inline-block",
    minWidth: "250px",
  },
  balance: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#00FFAA",
    letterSpacing: "0.5px",
  },
  loading: {
    padding: "50px",
    textAlign: "center",
    fontSize: "18px",
    color: "white",
  },
};
