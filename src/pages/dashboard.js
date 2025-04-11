"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useBalance";
import { usePrices } from "@/hooks/usePrices";
import MiniLoadingSpinner from "@/components/MiniLoadingSpinner"; 

const LivePriceTable = dynamic(() => import("@/components/LivePriceTable"), { ssr: false });

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
  const { user, wallet, authLoading, walletLoading } = useAuth();
  const { balances, loading: balancesLoading } = useBalance();
  const { prices, loading: pricesLoading } = usePrices();
  
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
    if (!wallet?.wallet?.address) return []; // ✅ Saugus patikrinimas
    return Object.keys(balances || {});
  }, [wallet, balances]);

  const isLoading = typeof window === "undefined" || !isClient || authLoading || walletLoading || balancesLoading || pricesLoading;

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
              const balanceData = balances?.[network];
              const priceData = prices?.[network === "tbnb" ? "bsc" : network];

              if (!balanceData || !priceData) return null; // ✅ Apsauga jei dar nespėjo užkrauti

              const symbol = routeNames[network] || network;
              const balanceFormatted = parseFloat(balanceData.balance || 0).toFixed(6);
              const eurValue = (parseFloat(balanceData.balance || 0) * (priceData.eur || 0)).toFixed(2);
              const usdValue = (parseFloat(balanceData.balance || 0) * (priceData.usd || 0)).toFixed(2);

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
