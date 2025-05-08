"use client";

import { useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { useAuth } from "@/contexts/AuthContext";

export function useTokenTransfer(chainId, tokenAddress) {
  const { getSignerForChain } = useAuth();
  const [transferring, setTransferring] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const transfer = async (to, amount) => {
    setTransferring(true);
    setError(null);
    setTxHash(null);

    try {
      const signer = getSignerForChain(chainId);
      if (!signer) throw new Error("No signer available");

      const contract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const decimals = await contract.decimals();
      const amt = ethers.parseUnits(amount.toString(), decimals);

      const tx = await contract.transfer(to, amt);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (err) {
      console.warn("❌ useTokenTransfer:", err.message);
      setError(err.message);
    } finally {
      setTransferring(false);
    }
  };

  return { transfer, transferring, txHash, error };
}
