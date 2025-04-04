"use client";

import dynamic from "next/dynamic";

const SendUI = dynamic(() => import("@/components/SendUI"), { ssr: false }); 

export default function SendPage() {
  return <SendUI />;
    }
