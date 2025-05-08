// src/hooks/useTokenBalance.js
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useTokenBalance() {
  const { chainId, tokenAddress, activeToken } = useNetwork();
  const { getAddressForChain } = useAuth();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!chainId) return;

      try {
        const provider = getProviderForChain(chainId);
        const userAddress = getAddressForChain(chainId);

        if (!userAddress) return;

        if (activeToken === "native") {
          const raw = await provider.getBalance(userAddress);
          setBalance(ethers.formatEther(raw));
        } else if (tokenAddress) {
          const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
          const raw = await contract.balanceOf(userAddress);
          const decimals = await contract.decimals();
          setBalance(ethers.formatUnits(raw, decimals));
        }
      } catch (err) {
        console.warn("❌ Token balance fetch error:", err.message);
        setBalance(null);
      }
    };

    fetchBalance();
  }, [chainId, tokenAddress, activeToken, getAddressForChain]);

  return { balance };
}
