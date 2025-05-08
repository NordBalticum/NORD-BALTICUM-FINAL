// src/hooks/useTokenApproval.js
"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminAddressByChainId } from "@/utils/networks";
import { getProviderForChain } from "@/utils/getProviderForChain";

/**
 * useTokenApproval – leidžia patikrinti ir iškviesti approve() ERC20 tokenui
 *
 * @param {number} chainId - tinklo ID
 * @param {string} tokenAddress - tokeno kontrakto adresas
 * @param {string} [spenderAddress] - adresas, kuriam suteikiamas leidimas (optional – naudos admin jei nepateikta)
 * @param {string|number} [amountRequired] - kiek reikia patvirtinti (optional – bus naudojama approve tik jei pateikta)
 */
export function useTokenApproval(chainId, tokenAddress, spenderAddress, amountRequired) {
  const { getSignerForChain, getPrimaryAddress } = useAuth();

  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const spender = spenderAddress || getAdminAddressByChainId(chainId);

  // Automatinis allowance tikrinimas
  useEffect(() => {
    if (!chainId || !tokenAddress || !spender || !amountRequired) return;

    const checkAllowance = async () => {
      try {
        const provider = getProviderForChain(chainId);
        const owner = getPrimaryAddress();
        if (!owner) return;

        const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
        const decimals = await contract.decimals();
        const allowance = await contract.allowance(owner, spender);
        const required = ethers.parseUnits(amountRequired.toString(), decimals);

        setApproved(allowance >= required);
      } catch (err) {
        console.warn("⚠️ useTokenApproval allowance check error:", err.message);
        setApproved(false);
      }
    };

    checkAllowance();
  }, [chainId, tokenAddress, spender, amountRequired, getPrimaryAddress]);

  // Paleidžia approve() jeigu reikia
  const approve = async (amountOverride) => {
    setApproving(true);
    setError(null);
    setTxHash(null);

    try {
      const signer = getSignerForChain(chainId);
      if (!signer || !spender) throw new Error("Signer or spender missing");

      const contract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const decimals = await contract.decimals();
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
