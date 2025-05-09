"use client";

/**
 * useBridge — v3.0 FINAL META-GRADE
 * ============================================
 * Naudoja bridge smart contract siųsti ERC20 ar native per EVM tiltą.
 * ✅ Palaiko 36+ EVM tinklus
 * ✅ Palaiko native ir ERC20 bridginimą
 * ✅ Automatinis decimals, signer, tx.wait
 * ✅ Full klaidų kontrolė
 */

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

  const bridge = async ({
    fromChainId,
    toChainId,
    bridgeAddress,
    tokenAddress,
    amount,
    isNative = false,
  }) => {
    setBridging(true);
    setError(null);
    setTxHash(null);

    try {
      // === Validation ===
      if (!fromChainId || !toChainId || !bridgeAddress || !amount) {
        throw new Error("❌ Missing bridge parameters");
      }

      const signer = getSignerForChain(fromChainId);
      if (!signer) throw new Error("❌ Signer unavailable");

      const contract = new ethers.Contract(bridgeAddress, BRIDGE_ABI, signer);

      // === Prepare amount ===
      let amt;
      if (isNative) {
        amt = ethers.parseEther(amount.toString());
      } else {
        if (!tokenAddress) throw new Error("❌ ERC20 token address missing");

        const token = new ethers.Contract(
          tokenAddress,
          ["function decimals() view returns (uint8)"],
          signer
        );

        const decimals = await token.decimals().catch(() => 18);
        amt = ethers.parseUnits(amount.toString(), decimals);
      }

      // === Call bridge function ===
      const tx = isNative
        ? await contract.bridgeNative(toChainId, { value: amt })
        : await contract.bridgeToken(toChainId, tokenAddress, amt);

      setTxHash(tx.hash);
      await tx.wait();
    } catch (err) {
      console.warn("❌ useBridge error:", err.message);
      setError(err.message || "Bridge failed");
    } finally {
      setBridging(false);
    }
  };

  return {
    bridge,     // function
    bridging,   // boolean
    txHash,     // string|null
    error,      // string|null
  };
}
