"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner"; // ✅ Spinner premium

const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

// ✅ Lokalios ikonėlės
const iconUrls = {
  ethereum: "/icons/eth.svg",
  bsc: "/icons/bnb.svg",
  tbnb: "/icons/bnb.svg",
  polygon: "/icons/matic.svg",
  avalanche: "/icons/avax.svg",
};

const names = {
  ethereum: "Ethereum",
  bsc: "BNB Smart Chain",
  tbnb: "BNB Testnet",
  polygon: "Polygon",
  avalanche: "Avalanche",
};

const routeNames = {
  ethereum: "eth",
  bsc: "bnb",
  tbnb: "tbnb",
  polygon: "matic",
  avalanche: "avax",
};

export default function Dashboard() {
  const router = useRouter();
  const { user, wallet, balances, rates, authLoading, walletLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && !user) {
      router.replace("/");
    }
  }, [isClient, authLoading, user, router]);

  const tokens = useMemo(() => {
    if (!wallet || !wallet.wallet || !wallet.wallet.address) return [];
    return Object.keys(balances || {});
  }, [wallet, balances]);

  const isLoading = !isClient || authLoading || walletLoading;

  return (
    <main className="container">
      <div className="dashboardWrapper">
        <LivePriceTable />

        <div className="assetList">
          {isLoading ? (
            <div className="loaderWrapper">
              <MiniLoadingSpinner />
            </div>
          ) : tokens.length === 0 ? (
            <div className="noAssets">No assets found.</div>
          ) : (
            tokens.map((network) => {
              const balance = balances?.[network] || 0;
              const price = rates?.[network === "tbnb" ? "bsc" : network] || { eur: 0, usd: 0 };

              const symbol = routeNames[network] || network;
              const balanceFormatted = balance.toFixed(6);
              const eurValue = (balance * price.eur).toFixed(2);
              const usdValue = (balance * price.usd).toFixed(2);

              return (
                <div
                  key={network}
                  className="assetItem"
                  onClick={() => router.push(`/${symbol}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="assetLeft">
                    <Image
                      src={iconUrls[network] || "/icons/default-icon.png"}
                      alt={`${symbol} logo`}
                      width={40}
                      height={40}
                      className="assetLogo"
                      priority
                      unoptimized
                    />
                    <div className="assetInfo">
                      <div className="assetSymbol">{symbol.toUpperCase()}</div>
                      <div className="assetName">{names[network] || "Unknown"}</div>
                    </div>
                  </div>
                  <div className="assetRight">
                    <div className="assetAmount">
                      {balanceFormatted} {symbol.toUpperCase()}
                    </div>
                    <div className="assetEur">
                      ≈ €{eurValue} | ≈ ${usdValue}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
