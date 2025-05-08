"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";
import { getProviderForChain } from "@/utils/getProviderForChain";
import BRIDGE_ABI from "@/abi/Bridge.json";

export function useBridge() {
  const { getSignerForChain } = useAuth();
  const [bridging, setBridging] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const bridge = async (fromChainId, toChainId, tokenAddress, amount) => {
    setBridging(true);
    setError(null);
    setTxHash(null);

    try {
      const signer = getSignerForChain(fromChainId);
      if (!signer) throw new Error("No signer available");

      const bridgeContract = new ethers.Contract(tokenAddress, BRIDGE_ABI, signer);
      const decimals = await bridgeContract.decimals().catch(() => 18);
      const amt = ethers.parseUnits(amount.toString(), decimals);

      const tx = await bridgeContract.bridge(toChainId, amt);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (err) {
      console.warn("❌ useBridge error:", err.message);
      setError(err.message);
    } finally {
      setBridging(false);
    }
  };

  return { bridge, bridging, txHash, error };
}
