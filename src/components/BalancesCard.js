"use client";

import styles from "./balancescard.module.css";
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
    <div className={styles.cardGrid}>
      {Object.entries(balances).map(([symbol, value]) => {
        const { eur, usd } = format(symbol, value);

        return (
          <motion.div
            key={symbol}
            className={styles.card}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className={styles.cardHeader}>
              {icons[symbol]}
              <span className={styles.cardSymbol}>
                {names[symbol] || symbol.toUpperCase()}
              </span>
            </div>

            <div className={styles.cardAmount}>
              {value.toFixed(6)} {symbol.toUpperCase()}
            </div>

            <div className={styles.cardConverted}>
              ≈ €{eur.toFixed(2)} / ${usd.toFixed(2)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
