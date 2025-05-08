// src/hooks/useAllowance.js
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { getAdminAddressByChainId } from "@/utils/networks";

export function useAllowance() {
  const { chainId, tokenAddress } = useNetwork();
  const { getAddressForChain } = useAuth();
  const [allowance, setAllowance] = useState(null);

  useEffect(() => {
    const fetchAllowance = async () => {
      try {
        const provider = getProviderForChain(chainId);
        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);

        const user = getAddressForChain(chainId);
        const spender = getAdminAddressByChainId(chainId);

        if (user && spender) {
          const raw = await contract.allowance(user, spender);
          const decimals = await contract.decimals();
          setAllowance(ethers.formatUnits(raw, decimals));
        }
      } catch (err) {
        console.warn("❌ Allowance fetch failed:", err.message);
        setAllowance(null);
      }
    };

    if (tokenAddress) fetchAllowance();
  }, [chainId, tokenAddress, getAddressForChain]);

  return { allowance };
}
