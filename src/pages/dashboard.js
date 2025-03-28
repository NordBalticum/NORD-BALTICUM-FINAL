"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "@/styles/dashboard.module.css";
import StarsBackground from "@/components/StarsBackground";
import BottomNavigation from "@/components/BottomNavigation";
import AvatarDisplay from "@/components/AvatarDisplay";

import { useAuth } from "@/contexts/AuthContext";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import { useWalletLoad } from "@/contexts/WalletLoadContext";
import { useBalance } from "@/contexts/BalanceContext";

const networks = [
  { name: "BNB Smart Chain", symbol: "BNB", logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png", route: "/bnb" },
  { name: "BSC Testnet", symbol: "TBNB", logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png", route: "/tbnb" },
  { name: "Ethereum", symbol: "ETH", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png", route: "/eth" },
  { name: "Polygon", symbol: "POL", logo: "https://cryptologos.cc/logos/polygon-matic-logo.png", route: "/pol" },
  { name: "Avalanche", symbol: "AVAX", logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png", route: "/avax" },
];

export default function Dashboard() {
  const router = useRouter();

  const { user: authUser, wallet: authWallet, balances: authBalances, sessionReady } = useAuth();
  const { user: fallbackUser, loadingUser } = useMagicLink();
  const { wallets: fallbackWallet, loadingWallets } = useWalletLoad();
  const { balances: fallbackBalances, loading: loadingBalances } = useBalance();

  const user = authUser || fallbackUser;
  const wallet = authWallet || fallbackWallet;
  const balances = authBalances || fallbackBalances;

  const [totalEUR, setTotalEUR] = useState("0.00");

  // ✅ Redirect tik jei viskas pilnai užsikrovę ir trūksta user arba wallet
  useEffect(() => {
    const allLoaded = sessionReady && !loadingUser && !loadingWallets;
    const needsRedirect = allLoaded && (!user || !wallet?.address);
    if (needsRedirect) {
      console.warn("❌ Neautorizuotas ar nepilna piniginė – redirect...");
      router.replace("/");
    }
  }, [sessionReady, loadingUser, loadingWallets, user, wallet, router]);

  // ✅ Apskaičiuojam total EUR kai yra balansai
  useEffect(() => {
    if (!balances || loadingBalances) return;
    const total = Object.values(balances).reduce((sum, b) => {
      const eur = parseFloat(b?.eur || 0);
      return sum + (isNaN(eur) ? 0 : eur);
    }, 0);
    setTotalEUR(total.toFixed(2));
  }, [balances, loadingBalances]);

  // ✅ Tik kai viskas pilnai užsikrovę, tada renderinam
  const fullyLoaded = sessionReady && user && wallet?.address && !loadingUser && !loadingWallets && !loadingBalances;
  if (!fullyLoaded) return null;

  return (
    <div className={styles.container}>
      <StarsBackground />

      <div className={styles.dashboardWrapper}>
        <div className={styles.avatarCenter}>
          <AvatarDisplay walletAddress={wallet.address} size={92} />
        </div>

        <div className={styles.totalValueContainer}>
          <p className={styles.totalLabel}>Total Value</p>
          <p className={styles.totalValue}>€ {totalEUR}</p>
        </div>

        <div className={styles.assetList}>
          {networks.map((net) => {
            const bal = balances?.[net.symbol] || { amount: "0.0000", eur: "0.00" };
            return (
              <div
                key={net.symbol}
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
                    {bal.amount} {net.symbol}
                  </span>
                  <span className={styles.assetEur}>€ {bal.eur}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
