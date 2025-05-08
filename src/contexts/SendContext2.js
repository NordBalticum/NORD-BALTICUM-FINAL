"use client";

// ===================================================
// 🔱 Nord Balticum – FINAL SENDCONTEXT.JS V1 LOCKED
// ✅ MetaMask-grade | AES-GCM | EIP-1559 | ERC20/native
// ✅ Supabase logging | Nonce | tx.wait | Retry + buffer
// ✅ 2.97% admin fee | fallback RPC | dropped tx detection
// ===================================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { getFallbackGasByChainId } from "@/data/networks";
import { useActiveSigner, useWalletAddress } from "@/utils/walletHelper";

// =======================================
// 🔐 AES-GCM DECRYPT – kaip MetaMask
// =======================================
const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

async function getKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret) throw new Error("❌ AES key missing from env");

  const base = await crypto.subtle.importKey(
    "raw",
    encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    base,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["decrypt"]
  );
}

async function decryptKey(ciphertext) {
  const { iv, data } = JSON.parse(atob(ciphertext));
  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  return decode(decrypted);
}

// =======================================
// 🔁 Retry su exponential backoff + timeout
// =======================================
async function retryWithBackoff(fn, maxRetries = 5, timeoutMs = 30000) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("⏱️ Timeout")), timeoutMs)
        ),
      ]);
    } catch (err) {
      if (i === maxRetries) throw err;
      const delay = 1000 * 2 ** i;
      console.warn(`🔁 Retry ${i + 1}/${maxRetries} in ${delay}ms`, err.message);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// =======================================
// 🧱 SendContext pradžia
// =======================================
const SendContext = createContext();

export const useSend = () => {
  const context = useContext(SendContext);
  if (!context) {
    throw new Error("useSend must be used within <SendProvider>");
  }
  return context;
};

export const SendProvider = ({ children }) => {
  const { session, safeRefreshSession } = useAuth();
  const { activeNetwork, chainId } = useNetwork();
  const { refetch } = useBalance();
  const activeSigner = useActiveSigner();
  const walletAddress = useWalletAddress();

  const [sending, setSending] = useState(false);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState(null);
  const [gasFee, setGasFee] = useState(null);
  const [adminFee, setAdminFee] = useState(null);
  const [totalFee, setTotalFee] = useState(null);

  // =======================================
// ⛽ GAS presetai (slow / avg / fast)
// =======================================
const GAS_PRESETS = {
  slow: { priority: "1", max: "20" },
  avg: { priority: "2", max: "30" },
  fast: { priority: "4", max: "50" },
};

// Automatinis lygio parinkimas pagal baseFee
function autoDetectGasLevel(baseFeeGwei) {
  const base = Number(baseFeeGwei);
  if (base < 20) return "slow";
  if (base < 40) return "avg";
  return "fast";
}

// =======================================
// ⛽ Gauti GAS fees (EIP-1559 + legacy fallback)
// =======================================
async function getGasFees(provider, gasLevel = "auto") {
  const feeData = await provider.getFeeData();
  const supports1559 = feeData.maxFeePerGas && feeData.maxPriorityFeePerGas;

  if (!supports1559) {
    const gasPrice = feeData.gasPrice ?? ethers.parseUnits("10", "gwei");
    return {
      isLegacy: true,
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: null,
    };
  }

  const baseFee = feeData.lastBaseFeePerGas ?? ethers.parseUnits("20", "gwei");
  const level = gasLevel === "auto"
    ? autoDetectGasLevel(ethers.formatUnits(baseFee, "gwei"))
    : gasLevel;

  const preset = GAS_PRESETS[level];

  return {
    isLegacy: false,
    maxFeePerGas: ethers.parseUnits(preset.max, "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits(preset.priority, "gwei"),
  };
}

// =======================================
// ⛽ Gauti GAS rezervą kiekvienam tinklui
// =======================================
function getGasBuffer(chainId) {
  const fallback = getFallbackGasByChainId(chainId);
  return fallback ? BigInt(fallback) : ethers.parseUnits("0.001", "ether");
}

// =======================================
// 🔍 Tikrinimas ar TX buvo dropped/replaced
// =======================================
async function isDroppedOrReplaced(provider, txHash) {
  const receipt = await provider.getTransactionReceipt(txHash);
  return !receipt || !receipt.blockNumber;
}

// =======================================
// 🧠 Gauti saugų nonce (pending vs latest)
// =======================================
async function getSafeNonce(provider, address) {
  const pending = await provider.getTransactionCount(address, "pending");
  const latest = await provider.getTransactionCount(address, "latest");
  return Math.max(pending, latest);
}

// =======================================
// 💸 calculateFees – gas + 2.97% + rezervas
// =======================================
const calculateFees = useCallback(
  async ({ to, amount, gasLevel = "auto", tokenAddress = null }) => {
    setFeeError(null);
    if (!chainId) return setFeeError("❌ Network not selected");
    if (!ethers.isAddress(to?.trim())) return setFeeError("❌ Invalid recipient address");

    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return setFeeError("❌ Invalid amount");

    setFeeLoading(true);
    try {
      const provider = getProviderForChain(chainId);
      const { maxPriorityFeePerGas, maxFeePerGas } = await getGasFees(provider, gasLevel);

      let decimals = 18;
      let transferData;
      let isERC20 = false;

      if (tokenAddress) {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        decimals = await tokenContract.decimals();
        const parsedAmount = ethers.parseUnits(parsed.toString(), decimals);
        transferData = tokenContract.interface.encodeFunctionData("transfer", [to, parsedAmount]);
        isERC20 = true;
      }

      const weiValue = tokenAddress ? ethers.Zero : ethers.parseEther(parsed.toString());
      const weiAdmin = (ethers.parseEther(parsed.toString()) * 297n) / 10000n;

      const [rawGasAdmin, rawGasMain] = await Promise.all([
        provider.estimateGas({ to: process.env.NEXT_PUBLIC_ADMIN_WALLET, value: weiAdmin }).catch(() => 21000n),
        isERC20
          ? provider.estimateGas({ to: tokenAddress, data: transferData }).catch(() => 60000n)
          : provider.estimateGas({ to, value: weiValue }).catch(() => 21000n),
      ]);

      const gasLimitAdmin = rawGasAdmin * 11n / 10n;
      const gasLimitMain = rawGasMain * 11n / 10n;
      const gasTotal = maxFeePerGas * (gasLimitAdmin + gasLimitMain);
      const reserve = getGasBuffer(chainId);

      setGasFee(Number(ethers.formatEther(gasTotal + reserve)));
      setAdminFee(Number(ethers.formatEther(weiAdmin)));
      setTotalFee(Number(ethers.formatEther(gasTotal + reserve + weiAdmin)));
    } catch (err) {
      console.error("⛽ Fee calculation error:", err);
      setFeeError("❌ Failed to calculate gas/fees");
    } finally {
      setFeeLoading(false);
    }
  },
  [chainId]
);

// =======================================
// 📊 getBalanceFor – gauti balansą (native + ERC20)
// =======================================
const getBalanceFor = useCallback(
  async (wallet, tokenAddress = null) => {
    if (!wallet || !chainId) return ethers.Zero;

    try {
      const provider = getProviderForChain(chainId);
      if (!tokenAddress) {
        return await provider.getBalance(wallet);
      }
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      return await tokenContract.balanceOf(wallet);
    } catch (err) {
      console.warn("⚠️ getBalanceFor klaida:", err);
      return ethers.Zero;
    }
  },
  [chainId]
);

  // =======================================
// ✈️ sendTransaction – 2x TX su retry, nonce, wait, log, gas
// =======================================
const sendTransaction = useCallback(
  async ({ to, amount, userEmail, gasLevel = "auto", tokenAddress = null }) => {
    const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (!ADMIN || !to || !amount || !userEmail || !chainId) {
      throw new Error("❌ Missing required transaction fields");
    }

    const recipient = to.trim().toLowerCase();
    if (!ethers.isAddress(recipient)) {
      throw new Error("❌ Invalid recipient address");
    }

    setSending(true);
    try {
      await safeRefreshSession();
      await refetch();

      const provider = getProviderForChain(chainId);
      const { maxPriorityFeePerGas, maxFeePerGas } = await getGasFees(provider, gasLevel);

      const isERC20 = Boolean(tokenAddress);
      const decimals = isERC20
        ? await new ethers.Contract(tokenAddress, ERC20_ABI, provider).decimals()
        : 18;

      const parsedAmount = Number(amount);
      const tokenAmount = ethers.parseUnits(parsedAmount.toString(), decimals);
      const weiAdmin = (ethers.parseEther(parsedAmount.toString()) * 297n) / 10000n;

      let signer = activeSigner;
      if (!signer) {
        signer = await getFallbackSigner(null, walletAddress, userEmail, provider);
      }

      // GAS + NONCE
      const transferData = isERC20
        ? new ethers.Contract(tokenAddress, ERC20_ABI, provider)
            .interface.encodeFunctionData("transfer", [recipient, tokenAmount])
        : undefined;

      const [rawGasAdmin, rawGasMain] = await Promise.all([
        provider.estimateGas({ to: ADMIN, value: weiAdmin }).catch(() => 21000n),
        isERC20
          ? provider.estimateGas({ to: tokenAddress, data: transferData }).catch(() => 60000n)
          : provider.estimateGas({ to: recipient, value: tokenAmount }).catch(() => 21000n),
      ]);

      const gasLimitAdmin = rawGasAdmin * 11n / 10n;
      const gasLimitMain = rawGasMain * 11n / 10n;
      const gasTotal = maxFeePerGas * (gasLimitAdmin + gasLimitMain);
      const reserve = getGasBuffer(chainId);

      const balance = await provider.getBalance(walletAddress || signer.address);
      const totalCost = weiAdmin + gasTotal + reserve;
      if (balance < totalCost) {
        throw new Error("❌ Insufficient funds (including gas + admin fee)");
      }

      const nonce = await getSafeNonce(provider, signer.address);

      // 1️⃣ ADMIN TX
      try {
        const txAdmin = await retryWithBackoff(() =>
          signer.sendTransaction({
            to: ADMIN,
            value: weiAdmin,
            gasLimit: gasLimitAdmin,
            maxPriorityFeePerGas,
            maxFeePerGas,
            nonce,
          })
        );
        await Promise.race([
          txAdmin.wait(),
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error("⏱️ Admin TX timeout")), 45_000)
          ),
        ]);
      } catch (err) {
        console.warn("⚠️ Admin TX failed:", err.message);
      }

      // 2️⃣ MAIN TX
      let tx;
      if (isERC20) {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        tx = await retryWithBackoff(() =>
          tokenContract.transfer(recipient, tokenAmount, {
            gasLimit: gasLimitMain,
            maxPriorityFeePerGas,
            maxFeePerGas,
            nonce: nonce + 1,
          })
        );
      } else {
        tx = await retryWithBackoff(() =>
          signer.sendTransaction({
            to: recipient,
            value: tokenAmount,
            gasLimit: gasLimitMain,
            maxPriorityFeePerGas,
            maxFeePerGas,
            nonce: nonce + 1,
          })
        );
      }

      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error("⏱️ TX wait timeout")), 60_000)
        ),
      ]);

      if (!tx?.hash || receipt?.status !== 1) {
        const dropped = await isDroppedOrReplaced(provider, tx?.hash);
        const errMsg = dropped
          ? "❌ Transaction dropped/replaced"
          : "❌ Transaction failed";

        await supabase.from("logs").insert([
          {
            user_email: userEmail,
            type: "transaction_error",
            message: errMsg,
          },
        ]);

        throw new Error(errMsg);
      }

      // ✅ SUPABASE TRANSACTION LOG
      await supabase.from("transactions").insert([
        {
          user_email: userEmail,
          sender_address: signer.address,
          receiver_address: recipient,
          amount: parsedAmount,
          fee: Number(ethers.formatEther(weiAdmin)),
          network: activeNetwork,
          type: isERC20 ? "send_token" : "send",
          tx_hash: tx.hash,
          token_address: tokenAddress || null,
        },
      ]);

      toast.success("✅ Transaction successful!", {
        position: "top-center",
        autoClose: 3000,
      });

      await refetch();
      return tx.hash;
    } catch (err) {
      console.error("❌ Transaction error:", err);

      await supabase.from("logs").insert([
        {
          user_email: userEmail,
          type: "transaction_error",
          message: err.message || "Unknown send error",
        },
      ]);

      toast.error("❌ " + (err.message || "Send failed"), {
        position: "top-center",
        autoClose: 5000,
      });

      throw err;
    } finally {
      setSending(false);
    }
  },
  [activeSigner, walletAddress, activeNetwork, chainId, safeRefreshSession, refetch]
);

// ==========================================
// ✅ Konteksto tiekimas visai aplikacijai
// ==========================================
return (
  <SendContext.Provider
    value={{
      // ✈️ Siuntimas (native + ERC20)
      sendTransaction,

      // 💸 GAS + Admin skaičiavimas
      calculateFees,

      // 📊 Balanso gavimas
      getBalanceFor,

      // 🔄 Būsena
      sending,

      // 💰 Fees
      gasFee,
      adminFee,
      totalFee,

      // 🔁 Fee status
      feeLoading,
      feeError,
    }}
  >
    {children}
  </SendContext.Provider>
);
};

// ==========================================
// 🛡️ useSend saugiklis
// ==========================================
export const useSend = () => {
  const context = useContext(SendContext);
  if (!context) {
    throw new Error("❌ useSend turi būti naudojamas su <SendProvider>");
  }
  return context;
};

// ==========================================
// ✅ Eksportai
// ==========================================
export { SendProvider };  
