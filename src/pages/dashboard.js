"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMagicLink } from "@/contexts/MagicLinkContext";
import Image from "next/image";
import styles from "@/styles/dashboard.module.css";
import BalancesCard from "@/components/BalancesCard";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useMagicLink();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  return (
    <main className={styles.container}>
      <div className={styles.dashboardWrapper} style={{ paddingTop: "116px" }}>
        <div
          className={styles.totalValueContainer}
          style={{
            marginBottom: "32px",
            animation: "fadeInDown 0.5s ease-out",
          }}
        >
          <Image
            src="/icons/logo.svg"
            alt="NordBalticum"
            width={340}
            height={122}
            priority
            className={styles.logo}
          />
          <div style={{ marginTop: "14px" }}>
            <p className={styles.totalLabel}>Total Balance</p>
            <h2 className={styles.totalValue}>Live Balances</h2>
          </div>
        </div>

        <div
          className={styles.assetList}
          style={{ animation: "fadeInUp 0.8s ease-out" }}
        >
          <BalancesCard />
        </div>
      </div>
    </main>
  );
}
