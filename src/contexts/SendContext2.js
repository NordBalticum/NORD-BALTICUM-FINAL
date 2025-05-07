"use client";

// ===================================================
// 🔱 META-GRADE SendContext.js – PART 1/5
// ✅ Powered by Nord Balticum / AI-JS 2025
// ✅ Includes AES decryption, retry logic, EIP-1559 gas, buffers, and utils
// ===================================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

import { ethers } from "ethers";
import { toast } from "react-toastify";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useActiveSigner, useWalletAddress } from "@/utils/walletHelper";
import { getProviderForChain } from "@/utils/getProviderForChain";
import { getFallbackGasByChainId } from "@/data/networks";

// ==============================
// 🧬 ERC20 ABI (minimal)
// ==============================
const ERC20_ABI = [
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint)"
];

// ==============================
// 🔐 AES-GCM DEŠIFRAVIMAS (256-bit)
// ==============================
const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

async function getKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret) throw new Error("❌ AES raktas nerastas .env faile");

  const baseKey = await crypto.subtle.importKey(
    "raw", encode(secret),
    { name: "PBKDF2" }, false, ["deriveKey"]
  );

  return crypto.subtle.deriveKey({
    name: "PBKDF2",
    salt: encode("nordbalticum-salt"),
    iterations: 100_000,
    hash: "SHA-256"
  }, baseKey, {
    name: "AES-GCM",
    length: 256
  }, false, ["decrypt"]);
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

// ==============================
// 🔁 Retry su timeout + exponential backoff
// ==============================
async function executeWithRetry(fn, maxRetries = 5, timeoutMs = 30000) {
  let attempt = 0;
  let delay = 2000;

  while (attempt < maxRetries) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("⏱️ Transakcijos timeout")), timeoutMs)
        ),
      ]);
      return result;
    } catch (err) {
      const isRetryable =
        err?.message?.includes("network") ||
        err?.message?.includes("timeout") ||
        err?.message?.includes("underpriced") ||
        err?.code === "NETWORK_ERROR";

      if (!isRetryable || attempt === maxRetries - 1) throw err;

      console.warn(`🔁 Retry #${attempt + 1} in ${delay / 1000}s...`, err.message);
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
      attempt++;
    }
  }
}

// ==============================
// ⛽ GAS PRESETS (slow / avg / fast) + autoDetect
// ==============================
const GAS_PRESETS = {
  slow: { priority: "1", max: "20" },
  avg:  { priority: "2", max: "30" },
  fast: { priority: "4", max: "50" },
};

function autoDetectGasLevel(baseFeeGwei) {
  const base = Number(baseFeeGwei);
  if (base < 20) return "slow";
  if (base < 40) return "avg";
  return "fast";
}

// ==============================
// ⛽ Gauti EIP-1559 arba legacy gas reikšmes
// ==============================
async function getGasFees(provider, gasLevel = "auto") {
  const feeData = await provider.getFeeData();
  const supports1559 = feeData.maxFeePerGas && feeData.maxPriorityFeePerGas;

  if (!supports1559) {
    const gasPrice = feeData.gasPrice ?? ethers.parseUnits("10", "gwei");
    return {
      maxPriorityFeePerGas: null,
      maxFeePerGas: gasPrice,
      isLegacy: true,
    };
  }

  const baseFee = feeData.lastBaseFeePerGas ?? ethers.parseUnits("20", "gwei");
  const level = gasLevel === "auto"
    ? autoDetectGasLevel(ethers.formatUnits(baseFee, "gwei"))
    : gasLevel;
  const preset = GAS_PRESETS[level];

  return {
    maxPriorityFeePerGas: ethers.parseUnits(preset.priority, "gwei"),
    maxFeePerGas: ethers.parseUnits(preset.max, "gwei"),
    isLegacy: false,
  };
}

// ==============================
// ⛽ Per-network gas buffer (iš networks.js)
// ==============================
function getGasBuffer(chainId) {
  return getFallbackGasByChainId(chainId);
}

// ===================================================
// ⚙️ SendContext – PART 2/5
// ✅ Includes context init + fee calculator (native + ERC20)
// ===================================================

const SendContext = createContext();

export const useSend = () => useContext(SendContext);

export const SendProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { selectedNetwork } = useNetwork();
  const { balances } = useBalance();

  const walletAddress = useWalletAddress();
  const signer = useActiveSigner();

  const [txStatus, setTxStatus] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // ============================================
  // 💸 calculateFees – su ERC20 logika + buferiais
  // ============================================
  const calculateFees = useCallback(async ({
    receiver,
    amount,
    tokenAddress = null, // null = native
    gasLevel = "auto"
  }) => {
    if (!signer || !selectedNetwork || !walletAddress)
      throw new Error("Wallet not ready");

    const chainId = selectedNetwork.chainId;
    const provider = getProviderForChain(chainId);

    let decimals = 18;
    let value = ethers.parseUnits(amount, 18);
    let contract = null;

    // ERC20 support
    if (tokenAddress) {
      contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      decimals = await contract.decimals();
      value = ethers.parseUnits(amount, decimals);
    }

    // Gas fees (EIP-1559 or legacy)
    const fees = await getGasFees(provider, gasLevel);
    let estimatedGas;

    if (contract) {
      estimatedGas = await contract.estimateGas.transfer(receiver, value);
    } else {
      estimatedGas = await provider.estimateGas({
        from: walletAddress,
        to: receiver,
        value,
      });
    }

    // Add 10% buffer to gasLimit
    const gasLimit = estimatedGas * 110n / 100n;

    // Buffer from network (native fallbackGas)
    const gasReserve = getGasBuffer(chainId);

    const txFee = fees.isLegacy
      ? gasLimit * fees.maxFeePerGas
      : gasLimit * fees.maxFeePerGas;

    return {
      gasLimit,
      txFee,
      gasReserve,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      isLegacy: fees.isLegacy,
      decimals,
      value,
      tokenAddress,
    };
  }, [signer, selectedNetwork, walletAddress]);

  // ===================================================
// 🚀 sendTransaction – PART 3/5
// ✅ Full tx logic (nonce, wait, admin send, logging, recovery)
// ===================================================

  const sendTransaction = useCallback(async ({
    receiver,
    amount,
    tokenAddress = null,
    gasLevel = "auto",
    note = "",
  }) => {
    if (!signer || !walletAddress || !selectedNetwork)
      throw new Error("Wallet not ready");

    const chainId = selectedNetwork.chainId;
    const provider = getProviderForChain(chainId);
    const adminAddress = getAdminAddress(chainId);

    const {
      gasLimit,
      txFee,
      gasReserve,
      maxFeePerGas,
      maxPriorityFeePerGas,
      isLegacy,
      value,
      decimals,
    } = await calculateFees({ receiver, amount, tokenAddress, gasLevel });

    // Balance check with native buffer
    const balance = await provider.getBalance(walletAddress);
    if (!tokenAddress && balance < (value + txFee + gasReserve)) {
      throw new Error("Insufficient funds with gas buffer");
    }

    setIsSending(true);
    setTxStatus("preparing");

    const nonce = await provider.getTransactionCount(walletAddress, "latest");

    const buildTx = (to) => tokenAddress
      ? {
          to: tokenAddress,
          data: new ethers.Interface(ERC20_ABI).encodeFunctionData("transfer", [to, value]),
          gasLimit,
          ...(isLegacy
            ? { gasPrice: maxFeePerGas }
            : {
                maxFeePerGas,
                maxPriorityFeePerGas,
              }),
          nonce,
        }
      : {
          to,
          value,
          gasLimit,
          ...(isLegacy
            ? { gasPrice: maxFeePerGas }
            : {
                maxFeePerGas,
                maxPriorityFeePerGas,
              }),
          nonce,
        };

    const txs = [
      { to: receiver, meta: "recipient" },
      { to: adminAddress, meta: "admin" },
    ];

    for (const { to, meta } of txs) {
      const txConfig = buildTx(to);
      let tx;

      setTxStatus(`sending_${meta}`);

      tx = await exponentialBackoff(async () => {
        const sentTx = await signer.sendTransaction(txConfig);
        return sentTx;
      });

      setTxStatus(`waiting_${meta}`);

      // Confirm with wait()
      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("TX timeout")), 60000)
        ),
      ]);

      if (!receipt || receipt.status !== 1)
        throw new Error("Transaction failed or dropped");

      // Supabase logging
      await logTransaction({
        from: walletAddress,
        to,
        txHash: tx.hash,
        chainId,
        amount,
        tokenAddress,
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        note,
      });
    }

    setTxStatus("done");
    setIsSending(false);
    return true;
  }, [signer, walletAddress, selectedNetwork, calculateFees]);

  // ===================================================
// 🛠️ Utilities – PART 4/5
// ✅ Retry, Logging, Admin + Gas buffer helpers
// ===================================================

const logTransaction = async ({
  from, to, txHash, chainId, amount,
  tokenAddress, status, blockNumber, note = ""
}) => {
  try {
    await supabase.from("transactions").insert([{
      from, to, txHash, chainId, amount: amount.toString(),
      token: tokenAddress || "native",
      status, blockNumber, note, timestamp: new Date().toISOString(),
    }]);
  } catch (err) {
    console.warn("Supabase log failed", err);
  }
};

const exponentialBackoff = async (fn, retries = 4, delay = 1000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(res => setTimeout(res, delay * 2 ** i));
    }
  }
};

const getAdminAddress = (chainId) => {
  const adminMap = {
    1: "0xAdminETH...", // Ethereum Mainnet
    137: "0xAdminMATIC...", // Polygon
    56: "0xAdminBNB...", // BSC
    // ... papildyk visais chainais
  };
  return adminMap[chainId] || process.env.DEFAULT_ADMIN;
};

const getGasBuffer = (chainId) => {
  const fallback = fallbackGasReserve[chainId];
  return fallback ? ethers.BigNumber.from(fallback) : ethers.BigNumber.from("1000000000000000"); // 0.001 ETH default
};

const getGasFees = async (provider) => {
  const feeData = await provider.getFeeData();

  if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
    return {
      isLegacy: false,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    };
  }

  // Legacy fallback
  const gasPrice = feeData.gasPrice || ethers.utils.parseUnits("5", "gwei");
  return {
    isLegacy: true,
    maxFeePerGas: gasPrice,
    maxPriorityFeePerGas: gasPrice,
  };
};

const getTokenDecimals = async (tokenAddress, provider) => {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return await tokenContract.decimals();
};

  // ===================================================
// ✅ SendContext Provider – PART 5/5
// 📦 Exports, useSend(), Provider wrap
// ===================================================

export const SendContext = createContext();

export const SendProvider = ({ children }) => {
  const { address: userAddress, encryptedPk } = useContext(AuthContext);
  const { selectedNetwork } = useContext(NetworkContext);
  const { balances, refreshBalance } = useContext(BalanceContext);

  const [sending, setSending] = useState(false);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [feeLevel, setFeeLevel] = useState("avg");
  const [gasLimit, setGasLimit] = useState(null);
  const [txError, setTxError] = useState("");
  const [txHash, setTxHash] = useState("");

  const provider = useMemo(() => getProviderForChain(selectedNetwork?.chainId), [selectedNetwork]);
  const signer = useMemo(() => {
    if (!provider || !encryptedPk) return null;
    try {
      const decrypted = decryptPrivateKey(encryptedPk);
      return new ethers.Wallet(decrypted, provider);
    } catch (e) {
      console.error("Signer decrypt failed", e);
      return null;
    }
  }, [provider, encryptedPk]);

  const estimateFees = useCallback(async ({ to, amount, tokenAddress }) => {
    try {
      setTxError("");
      const gas = await calculateFees({ to, amount, tokenAddress, provider, signer, feeLevel });
      setGasEstimate(gas.totalFeeFormatted);
      setGasLimit(gas.gasLimit);
    } catch (err) {
      console.error("Fee estimation failed", err);
      setTxError("Fee estimation failed");
    }
  }, [provider, signer, feeLevel]);

  const send = useCallback(async ({ to, amount, tokenAddress }) => {
    if (!signer || !selectedNetwork) return;
    setSending(true);
    setTxError("");
    setTxHash("");

    try {
      const result = await sendTransaction({
        signer,
        provider,
        to,
        amount,
        tokenAddress,
        chainId: selectedNetwork.chainId,
        userAddress,
        feeLevel,
      });

      if (result.status === "success") {
        setTxHash(result.txHash);
        refreshBalance(); // auto-update
      } else {
        setTxError(result.error || "Transaction failed");
      }
    } catch (err) {
      console.error("Send failed", err);
      setTxError("Unexpected error occurred");
    } finally {
      setSending(false);
    }
  }, [signer, provider, selectedNetwork, userAddress, feeLevel]);

  const value = {
    sending,
    send,
    estimateFees,
    gasEstimate,
    gasLimit,
    txError,
    txHash,
    setFeeLevel,
    feeLevel,
  };

  return <SendContext.Provider value={value}>{children}</SendContext.Provider>;
};

export const useSend = () => {
  const ctx = useContext(SendContext);
  if (!ctx) throw new Error("useSend must be used within SendProvider");
  return ctx;
};
