"use client";

/**
 * useBridge — MetaMask-grade cross-chain bridge hook
 * ==================================================
 * Veikia su mūsų 36+ EVM tinklais, ERC20 kontraktais ir bridge smart contract.
 * Automatiškai valdo signer, decimals, txHash, loading ir klaidų būsenas.
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
      if (!fromChainId || !toChainId || !bridgeAddress || !amount) {
        throw new Error("Missing required parameters");
      }

      const signer = getSignerForChain(fromChainId);
      if (!signer) throw new Error("Signer not available");

      const contract = new ethers.Contract(bridgeAddress, BRIDGE_ABI, signer);

      let amt;
      if (isNative) {
        amt = ethers.parseEther(amount.toString());
      } else {
        const tokenContract = new ethers.Contract(tokenAddress, [
          "function decimals() view returns (uint8)",
        ], signer);
        const decimals = await tokenContract.decimals().catch(() => 18);
        amt = ethers.parseUnits(amount.toString(), decimals);
      }

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
