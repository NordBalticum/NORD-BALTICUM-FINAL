"use client";

import { useBalances } from "@/contexts/BalanceContext";
import { motion } from "framer-motion";
import { FaEthereum } from "react-icons/fa";
import { SiBinance, SiPolygon, SiAvalanche } from "react-icons/si";

const icons = {
  eth: <FaEthereum size={22} />,
  bnb: <SiBinance size={20} />,
  tbnb: <SiBinance size={20} />,
  matic: <SiPolygon size={20} />,
  avax: <SiAvalanche size={20} />,
};

const names = {
  eth: "Ethereum",
  bnb: "BNB",
  tbnb: "BNB Testnet",
  matic: "Polygon",
  avax: "Avalanche",
};

export default function BalancesCard() {
  const { balances, format, loading } = useBalances();

  if (loading || !balances) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "24px",
        padding: "24px",
      }}
    >
      {Object.entries(balances).map(([symbol, value]) => {
        const { eur, usd } = format(symbol, value);

        return (
          <motion.div
            key={symbol}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              padding: "20px",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 0 28px rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              minHeight: "140px",
              color: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              {icons[symbol]}
              <span style={{ fontWeight: 600, fontSize: "1rem", letterSpacing: "0.5px" }}>
                {names[symbol] || symbol.toUpperCase()}
              </span>
            </div>

            <div style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "0.3px" }}>
              {value.toFixed(6)} {symbol.toUpperCase()}
            </div>

            <div
              style={{
                fontSize: "0.85rem",
                marginTop: "4px",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              ≈ €{eur.toFixed(2)} / ${usd.toFixed(2)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
