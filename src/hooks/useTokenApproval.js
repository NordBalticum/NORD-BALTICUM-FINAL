"use client";

/**
 * useTokenApproval — Final MetaMask-Grade Version v2.0
 * =====================================================
 * • Automatiškai tikrina allowance tarp user → spender
 * • Paleidžia approve jei reikia
 * • Full EVM + ERC20 + DApp compatibility
 */

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminAddressByChainId } from "@/utils/networks";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useTokenApproval(chainId, tokenAddress, spenderAddress, amountRequired) {
  const { getSignerForChain, getPrimaryAddress } = useAuth();

  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const spender = spenderAddress || getAdminAddressByChainId(chainId);

  useEffect(() => {
    if (!chainId || !tokenAddress || !spender || !amountRequired) return;

    const checkAllowance = async () => {
      try {
        const provider = getProviderForChain(chainId);
        const owner = getPrimaryAddress();

        if (!owner || !ethers.isAddress(owner)) throw new Error("Invalid owner address");
        if (!ethers.isAddress(spender)) throw new Error("Invalid spender address");

        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);

        const [allowance, decimals] = await Promise.all([
          contract.allowance(owner, spender),
          contract.decimals().catch(() => 18),
        ]);

        const required = ethers.parseUnits(amountRequired.toString(), decimals);
        setApproved(BigInt(allowance) >= BigInt(required));
      } catch (err) {
        console.warn("⚠️ useTokenApproval check error:", err.message);
        setApproved(false);
      }
    };

    checkAllowance();
  }, [chainId, tokenAddress, spender, amountRequired, getPrimaryAddress]);

  const approve = async (amountOverride) => {
    setApproving(true);
    setError(null);
    setTxHash(null);

    try {
      const signer = getSignerForChain(chainId);
      if (!signer || !ethers.isAddress(spender)) throw new Error("Missing or invalid signer/spender");

      const contract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const decimals = await contract.decimals().catch(() => 18);
      const amt = ethers.parseUnits(
        (amountOverride || amountRequired || "0").toString(),
        decimals
      );

      const tx = await contract.approve(spender, amt);
      setTxHash(tx.hash);
      await tx.wait();

      setApproved(true);
    } catch (err) {
      console.error("❌ useTokenApproval error:", err.message);
      setError(err.message);
      setApproved(false);
    } finally {
      setApproving(false);
    }
  };

  return {
    approve,
    approving,
    approved,
    txHash,
    error,
    spender,
  };
}
