"use client";

import { useState } from "react";
import { useBalances } from "@/contexts/BalanceContext";
import { motion } from "framer-motion";
import { FaEthereum } from "react-icons/fa";
import { SiBinance, SiPolygon, SiAvalanche } from "react-icons/si";

const icons = {
  eth: <FaEthereum size={18} />,
  bnb: <SiBinance size={18} />,
  matic: <SiPolygon size={18} />,
  avax: <SiAvalanche size={18} />,
};

const names = {
  eth: "Ethereum",
  bnb: "Binance",
  matic: "Polygon",
  avax: "Avalanche",
};

const WalletSwitcher = ({ onSelect }) => {
  const { balances, format } = useBalances();
  const [selected, setSelected] = useState("bnb");

  const handleSelect = (symbol) => {
    setSelected(symbol);
    if (onSelect) onSelect(symbol);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        overflowX: "auto",
        padding: "12px 0",
        marginBottom: "24px",
      }}
    >
      {Object.entries(balances || {}).map(([symbol, value]) => {
        const { usd } = format(symbol, value);
        return (
          <motion.div
            key={symbol}
            onClick={() => handleSelect(symbol)}
            whileTap={{ scale: 0.95 }}
            style={{
              flex: "0 0 auto",
              padding: "14px 18px",
              borderRadius: "16px",
              background:
                selected === symbol
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(255, 255, 255, 0.03)",
              border:
                selected === symbol
                  ? "1px solid #ffd700"
                  : "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 0 14px rgba(255,255,255,0.04)",
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.3s ease",
              minWidth: "150px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              {icons[symbol]}
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                {names[symbol]}
              </span>
            </div>
            <div style={{ fontSize: "0.78rem", opacity: 0.85 }}>
              {value.toFixed(6)} {symbol.toUpperCase()}
            </div>
            <div style={{ fontSize: "0.7rem", opacity: 0.5 }}>
              ${usd.toFixed(2)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default WalletSwitcher;
