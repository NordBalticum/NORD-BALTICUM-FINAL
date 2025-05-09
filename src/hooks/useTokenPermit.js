"use client";

/**
 * useTokenPermit — Final MetaMask-Grade Hook
 * ==========================================
 * Generates a `permit` message for the user's address, signs with the signer, and returns the signature.
 * Compatible with EIP-2612 supporting tokens.
 */

import { useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@/abi/ERC20.json";
import { useAuth } from "@/contexts/AuthContext";
import { getProviderForChain } from "@/utils/getProviderForChain";

export function useTokenPermit() {
  const { getSignerForChain, getPrimaryAddress } = useAuth();
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState(null);
  const [error, setError] = useState(null);

  const signPermit = async ({
    chainId,
    tokenAddress,
    spender,
    value,
    deadline = Math.floor(Date.now() / 1000) + 3600, // 1h
  }) => {
    setSigning(true);
    setSignature(null);
    setError(null);

    try {
      // Get the provider and signer for the specified chain
      const provider = getProviderForChain(chainId);
      const signer = getSignerForChain(chainId);
      const owner = getPrimaryAddress();

      if (!signer || !ethers.isAddress(owner)) throw new Error("Wallet not ready");

      const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);

      // Fetch necessary details like nonce and name
      const nonce = await contract.nonces(owner);
      const name = await contract.name();
      const version = "1"; // versioning for the domain

      const domain = {
        name,
        version,
        chainId,
        verifyingContract: tokenAddress,
      };

      // Define the types for the permit message
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      // Define the message to sign
      const message = {
        owner,
        spender,
        value,
        nonce,
        deadline,
      };

      // Sign the message with the user's signer
      const signed = await signer.signTypedData(domain, types, message);
      setSignature(signed);
      return { signature: signed, nonce, deadline };
    } catch (err) {
      console.warn("❌ useTokenPermit error:", err.message);
      setError(err.message);
      return null;
    } finally {
      setSigning(false);
    }
  };

  return {
    signPermit,
    signing,
    signature,
    error,
  };
}
