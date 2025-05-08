"use client";

import { useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { useAuth } from "@/contexts/AuthContext";

export function useTokenTransferFrom(chainId, tokenAddress) {
  const { getSignerForChain } = useAuth();
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const transferFrom = async (from, to, amount) => {
    setSending(true);
    setError(null);
    setTxHash(null);

    try {
      const signer = getSignerForChain(chainId);
      if (!signer) throw new Error("No signer available");

      const contract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const decimals = await contract.decimals();
      const amt = ethers.parseUnits(amount.toString(), decimals);

      const tx = await contract.transferFrom(from, to, amt);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (err) {
      console.warn("❌ useTokenTransferFrom:", err.message);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return { transferFrom, sending, txHash, error };
}
