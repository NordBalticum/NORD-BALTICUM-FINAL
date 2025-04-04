"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function SwitchNetworkComponent() {
  const { activeNetwork, setActiveNetwork, loading } = useAuth();
  const [switching, setSwitching] = useState(false);

  const networks = [
    { id: "eth", label: "Ethereum" },
    { id: "bnb", label: "BNB Smart Chain" },
    { id: "tbnb", label: "BNB Testnet" },
    { id: "matic", label: "Polygon" },
    { id: "avax", label: "Avalanche" },
  ];

  const handleSwitch = async (networkId) => {
    if (networkId === activeNetwork) return;
    setSwitching(true);

    try {
      setActiveNetwork(networkId);
    } catch (error) {
      console.error("Switch network error:", error.message);
    } finally {
      setTimeout(() => {
        setSwitching(false);
      }, 500); // Trumpas timeout efektui
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading networks...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Switch Network</h2>

      <div style={styles.grid}>
        {networks.map((net) => (
          <button
            key={net.id}
            onClick={() => handleSwitch(net.id)}
            disabled={switching}
            style={{
              ...styles.button,
              backgroundColor: activeNetwork === net.id ? "#0070f3" : "#222",
              border: activeNetwork === net.id ? "2px solid #00ffcc" : "1px solid #555",
              cursor: switching ? "not-allowed" : "pointer",
            }}
          >
            {net.label}
          </button>
        ))}
      </div>

      {switching && (
        <p style={styles.switching}>Switching network...</p>
      )}
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
    fontSize: "26px",
    marginBottom: "25px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    justifyContent: "center",
  },
  button: {
    minWidth: "140px",
    padding: "12px 18px",
    borderRadius: "10px",
    fontWeight: "bold",
    color: "white",
    backgroundColor: "#222",
    fontSize: "15px",
    transition: "all 0.3s ease",
  },
  loading: {
    padding: "50px",
    textAlign: "center",
    fontSize: "18px",
    color: "white",
  },
  switching: {
    marginTop: "20px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#00ffcc",
    animation: "fade 1s infinite alternate",
  },
};
