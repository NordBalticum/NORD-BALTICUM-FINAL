"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function BalanceComponent() {
  const { wallet, balances, refreshBalance, loading, activeNetwork } = useAuth();
  const [localBalance, setLocalBalance] = useState(0);

  useEffect(() => {
    const fetchAndSetBalance = async () => {
      if (!wallet?.signers?.[activeNetwork]) return;
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
        Your {activeNetwork.toUpperCase()} Balance
      </h2>

      <p style={styles.balance}>
        {localBalance?.toFixed(6)} {activeNetwork.toUpperCase()}
      </p>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    textAlign: "center",
    color: "white",
  },
  title: {
    fontSize: "22px",
    marginBottom: "10px",
    textTransform: "uppercase",
  },
  balance: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#00FFAA",
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    fontSize: "18px",
    color: "white",
  },
};
