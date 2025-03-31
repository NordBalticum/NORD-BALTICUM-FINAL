"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import styles from "@/styles/dashboard.module.css";
import background from "@/styles/background.module.css";

import StarsBackground from "@/components/StarsBackground";
import BottomNavigation from "@/components/BottomNavigation";
import AvatarDisplay from "@/components/AvatarDisplay";

import { useMagicLink } from "@/contexts/MagicLinkContext";
import { getWalletBalance } from "@/lib/ethers";
import { fetchPrices } from "@/utils/fetchPrices"; // jei nėra – duosiu

const networksData = [
  {
    key: "BNB",
    name: "BNB Smart Chain",
    symbol: "BNB",
    logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
    route: "/bnb",
  },
  {
    key: "TBNB",
    name: "BSC Testnet",
    symbol: "TBNB",
    logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    route: "/tbnb",
  },
  {
    key: "ETH",
    name: "Ethereum",
    symbol: "ETH",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    route: "/eth",
  },
  {
    key: "MATIC",
    name: "Polygon",
    symbol: "MATIC",
    logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
    route: "/pol",
  },
  {
    key: "AVAX",
    name: "Avalanche",
    symbol: "AVAX",
    logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
    route: "/avax",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet } = useMagicLink();

  const [balances, setBalances] = useState({});
  const [totalEUR, setTotalEUR] = useState("0.00");

  const networks = useMemo(() => networksData, []);

  useEffect(() => {
    if (!user || !wallet?.address) router.push("/");
  }, [user, wallet]);

  useEffect(() => {
    const load = async () => {
      if (!wallet?.address) return;

      try {
        const prices = await fetchPrices();
        const updated = {};
        let total = 0;

        await Promise.all(
          networks.map(async (net) => {
            try {
              const { formatted } = await getWalletBalance(wallet.address, net.key.toLowerCase());
              const price = prices?.[net.symbol.toLowerCase()] || 0;
              const eur = (parseFloat(formatted) * price).toFixed(2);

              updated[net.key] = {
                balance: formatted,
                eur,
              };

              total += parseFloat(eur);
            } catch (err) {
              console.warn(`❌ ${net.symbol} balance failed:`, err.message);
              updated[net.key] = {
                balance: "0.00000",
                eur: "0.00",
              };
            }
          })
        );

        setBalances(updated);
        setTotalEUR(total.toFixed(2));
      } catch (e) {
        console.error("❌ Failed to load balances:", e.message);
      }
    };

    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [wallet]);

  return (
    <main className={`${styles.container} ${background.gradient}`}>
      <StarsBackground />

      <div className={styles.dashboardWrapper}>
        {wallet?.address && (
          <div className={styles.avatarCenter}>
            <AvatarDisplay walletAddress={wallet.address} size={92} />
          </div>
        )}

        <div className={styles.totalValueContainer}>
          <p className={styles.totalLabel}>Total Value</p>
          <p className={styles.totalValue}>€ {totalEUR}</p>
        </div>

        <div className={styles.assetList}>
          {networks.map((net) => {
            const bal = balances?.[net.key] || {
              balance: "0.00000",
              eur: "0.00",
            };

            return (
              <div
                key={net.key}
                className={styles.assetItem}
                onClick={() => router.push(net.route)}
              >
                <div className={styles.assetLeft}>
                  <Image
                    src={net.logo}
                    alt={`${net.symbol} Logo`}
                    width={42}
                    height={42}
                    className={styles.assetLogo}
                    unoptimized
                  />
                  <div className={styles.assetInfo}>
                    <span className={styles.assetSymbol}>{net.symbol}</span>
                    <span className={styles.assetName}>{net.name}</span>
                  </div>
                </div>

                <div className={styles.assetRight}>
                  <span className={styles.assetAmount}>
                    {parseFloat(bal.balance || 0).toFixed(5)} {net.symbol}
                  </span>
                  <span className={styles.assetEur}>€ {bal.eur}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}
