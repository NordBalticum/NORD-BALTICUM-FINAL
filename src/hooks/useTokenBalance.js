// src/hooks/useTokenBalance.js
"use client";

/**
 * useTokenBalance — Final MetaMask-Grade v2.1
 * ============================================
 * Universalus native ir ERC20 token balansų hook'as.
 * Automatiškai aptinka `activeToken` ("native" arba ERC20).
 * Naudoja saugų minimalų ABI iš utils/erc20ABI.js.
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { getProviderForChain } from "@/utils/getProviderForChain";
import ERC20_ABI from "@/utils/erc20ABI";

export function useTokenBalance() {
  const { chainId, tokenAddress, activeToken } = useNetwork();
  const { getAddressForChain } = useAuth();

  const [rawBalance, setRawBalance] = useState(ethers.Zero);
  const [formattedBalance, setFormattedBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chainId) return;

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = getProviderForChain(chainId);
        const userAddress = getAddressForChain(chainId);

        if (!userAddress || !ethers.isAddress(userAddress)) {
          throw new Error("Invalid user address");
        }

        if (activeToken === "native") {
          const raw = await provider.getBalance(userAddress);
          setRawBalance(raw);
          setFormattedBalance(ethers.formatEther(raw));
        } else if (tokenAddress && ethers.isAddress(tokenAddress)) {
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const [raw, decimals] = await Promise.all([
            contract.balanceOf(userAddress),
            contract.decimals().catch(() => 18),
          ]);
          setRawBalance(raw);
          setFormattedBalance(ethers.formatUnits(raw, decimals));
        } else {
          throw new Error("Missing or invalid tokenAddress");
        }
      } catch (err) {
        console.warn("❌ useTokenBalance error:", err.message);
        setRawBalance(ethers.Zero);
        setFormattedBalance("0");
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [chainId, tokenAddress, activeToken, getAddressForChain]);

  return {
    balance: rawBalance,              // BigInt (wei)
    formatted: formattedBalance,     // Human-readable
    loading,
    error,
  };
}
