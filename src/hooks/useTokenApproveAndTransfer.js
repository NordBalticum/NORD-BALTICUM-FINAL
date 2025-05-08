"use client";

/**
 * useTokenApproveAndTransfer — Final MetaMask-grade 2.0
 * ======================================================
 * ✅ Tikrina allowance
 * ✅ Jei reikia — approve().wait()
 * ✅ Vėliau transfer().wait()
 * ✅ Automatiniai saugikliai, decimals fallback, visų tinklų palaikymas
 * ✅ Callback'ai UI etapams (optional)
 */

import { useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { useAuth } from "@/contexts/AuthContext";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { getAdminAddressByChainId } from "@/utils/networks";

export function useTokenApproveAndTransfer(chainId, tokenAddress, spenderOverride = null) {
  const { getSignerForChain, getPrimaryAddress } = useAuth();

  const [processing, setProcessing] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | approving | approved | transferring | sent | error
  const [error, setError] = useState(null);

  /**
   * @param {string} to - recipient address
   * @param {string|number} amount - token amount (human readable)
   * @param {function} [onUpdate] - optional callback for status updates
   */
  const send = async (to, amount, onUpdate) => {
    setProcessing(true);
    setError(null);
    setTxHash(null);
    setStatus("idle");

    try {
      if (!ethers.isAddress(to)) throw new Error("Invalid recipient address");
      if (!ethers.isAddress(tokenAddress)) throw new Error("Invalid token address");
      if (!amount || isNaN(amount) || Number(amount) <= 0) throw new Error("Invalid amount");

      const signer = getSignerForChain(chainId);
      const sender = getPrimaryAddress();
      if (!signer || !sender) throw new Error("Missing wallet or signer");

      const provider = getProviderForChain(chainId);
      const contract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const readOnly = new ethers.Contract(tokenAddress, ERC20ABI, provider);
      const decimals = await readOnly.decimals().catch(() => 18);
      const amt = ethers.parseUnits(amount.toString(), decimals);

      const spender = spenderOverride || getAdminAddressByChainId(chainId);
      if (!spender) throw new Error("Missing spender address");

      const allowance = await readOnly.allowance(sender, spender);

      if (allowance < amt) {
        setStatus("approving");
        onUpdate?.("approving");

        const approveTx = await contract.approve(spender, amt);
        await approveTx.wait();

        setStatus("approved");
        onUpdate?.("approved");
      }

      setStatus("transferring");
      onUpdate?.("transferring");

      const transferTx = await contract.transfer(to, amt);
      setTxHash(transferTx.hash);

      await transferTx.wait();

      setStatus("sent");
      onUpdate?.("sent");
    } catch (err) {
      console.warn("❌ useTokenApproveAndTransfer error:", err.message);
      setError(err.message);
      setStatus("error");
      onUpdate?.("error");
    } finally {
      setProcessing(false);
    }
  };

  return {
    send,
    processing,
    status,   // idle | approving | approved | transferring | sent | error
    txHash,
    error,
  };
}
