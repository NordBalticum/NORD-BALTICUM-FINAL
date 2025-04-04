"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const BalanceComponent = () => {
  const { wallet, balances, refreshBalance, loading, activeNetwork } = useAuth();
  const [localBalance, setLocalBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!wallet || !wallet.signers || !activeNetwork) return;
      await refreshBalance(activeNetwork);
      setLocalBalance(balances[activeNetwork] || 0);
    };

    fetchBalance();

    const interval = setInterval(fetchBalance, 30000); // Kas 30s atnaujinam
    return () => clearInterval(interval);
  }, [wallet, balances, refreshBalance, activeNetwork]);

  if (loading) {
    return <div>Loading balance...</div>;
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Your {activeNetwork.toUpperCase()} Balance:</h2>
      <p style={{ fontSize: "24px", fontWeight: "bold" }}>
        {localBalance?.toFixed(6)} {activeNetwork.toUpperCase()}
      </p>
    </div>
  );
};

export default BalanceComponent;
