"use client";

import dynamic from "next/dynamic";

// ✅ Dinaminis importas visam Dashboard puslapiui
const DashboardPage = dynamic(() => import("@/components/DashboardPage"), {
  ssr: false, // ❗️ Svarbiausia - išjungti SSR
});

export default function Dashboard() {
  return <DashboardPage />;
    }
