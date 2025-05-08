// src/hooks/useTokenApproval.js
"use client";

import { useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminAddressByChainId } from "@/utils/networks";

export function useTokenApproval(chainId, tokenAddress) {
  const { getSignerForChain } = useAuth();
  const [approving, setApproving] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const approve = async (amount) => {
    setApproving(true);
    setError(null);
    setTxHash(null);

    try {
      const signer = getSignerForChain(chainId);
      const spender = getAdminAddressByChainId(chainId);

      if (!signer || !spender) throw new Error("Signer or spender missing");

      const contract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const decimals = await contract.decimals();
      const amountFormatted = ethers.parseUnits(amount.toString(), decimals);

      const tx = await contract.approve(spender, amountFormatted);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (err) {
      console.warn("❌ Approval failed:", err.message);
      setError(err.message);
    } finally {
      setApproving(false);
    }
  };

  return { approve, approving, txHash, error };
}
