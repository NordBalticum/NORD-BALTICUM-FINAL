"use client";

// ===================================================
// 🔱 META-GRADE SendContext.js – PART 1/5
// ✅ AES Decryption | ERC20 ABI | Retry Logic | Gas Utils
// ✅ Nord Balticum 2025 – Better Than MetaMask
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

// ==============================
// 🧬 ERC20 ABI – minimal
// ==============================
const ERC20_ABI = [
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint)"
];

// ==============================
// 🔐 AES-GCM DECRYPTION
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

export async function decryptPrivateKey(ciphertext) {
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
// 🔁 Exponential Backoff Retry
// ==============================
export async function retryWithBackoff(fn, retries = 4, baseDelay = 1000) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      const delay = baseDelay * 2 ** i;
      console.warn(`Retry #${i + 1} after ${delay / 1000}s...`, err.message);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

// ==============================
// ⛽ Gas Presets + Auto Detection
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
// ⛽ EIP-1559 / Legacy Gas Fetcher
// ==============================
export async function getGasFees(provider, level = "auto") {
  const feeData = await provider.getFeeData();
  const supports1559 = feeData.maxFeePerGas && feeData.maxPriorityFeePerGas;

  if (!supports1559) {
    const fallback = feeData.gasPrice ?? ethers.parseUnits("10", "gwei");
    return {
      isLegacy: true,
      maxFeePerGas: fallback,
      maxPriorityFeePerGas: null,
    };
  }

  const baseFee = feeData.lastBaseFeePerGas ?? ethers.parseUnits("20", "gwei");
  const selectedLevel = level === "auto"
    ? autoDetectGasLevel(ethers.formatUnits(baseFee, "gwei"))
    : level;
  const preset = GAS_PRESETS[selectedLevel];

  return {
    isLegacy: false,
    maxFeePerGas: ethers.parseUnits(preset.max, "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits(preset.priority, "gwei"),
  };
}

// ==============================
// ⛽ Per-Network Gas Reserve
// ==============================
export function getGasBuffer(chainId) {
  const fallback = getFallbackGasByChainId(chainId);
  return fallback ? BigInt(fallback) : BigInt("1000000000000000"); // 0.001 ETH fallback
}

// ===================================================
// ⚙️ SendContext.js – PART 2/5
// ✅ calculateFees() with ERC20, buffer, gas presets
// ===================================================

const SendContext = createContext();

export const useSend = () => {
  const ctx = useContext(SendContext);
  if (!ctx) throw new Error("❌ useSend must be used within SendProvider");
  return ctx;
};

export const SendProvider = ({ children }) => {
  const { address: userAddress, encryptedPk } = useAuth();
  const { selectedNetwork } = useNetwork();
  const { balances, refreshBalance } = useBalance();

  const provider = useMemo(() => getProviderForChain(selectedNetwork?.chainId), [selectedNetwork]);

  const signer = useMemo(() => {
    if (!provider || !encryptedPk) return null;
    try {
      const decrypted = decryptPrivateKey(encryptedPk);
      return new ethers.Wallet(decrypted, provider);
    } catch (err) {
      console.error("❌ Signer decryption failed", err);
      return null;
    }
  }, [provider, encryptedPk]);

  const [sending, setSending] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txError, setTxError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [feeLevel, setFeeLevel] = useState("avg");

  // ============================================
  // 💸 calculateFees – ERC20/native logic, buffers, gas
  // ============================================
  const calculateFees = useCallback(async ({
    to,
    amount,
    tokenAddress = null,
    gasLevel = "auto"
  }) => {
    if (!provider || !signer || !selectedNetwork || !userAddress) {
      throw new Error("❌ Wallet or network not ready");
    }

    const chainId = selectedNetwork.chainId;
    let decimals = 18;
    let value = ethers.parseUnits(amount, decimals);
    let contract = null;

    // ERC20 logic
    if (tokenAddress) {
      contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      decimals = await contract.decimals();
      value = ethers.parseUnits(amount, decimals);
    }

    const { maxFeePerGas, maxPriorityFeePerGas, isLegacy } = await getGasFees(provider, gasLevel);

    let estimatedGas;
    if (tokenAddress) {
      estimatedGas = await contract.connect(signer).estimateGas.transfer(to, value);
    } else {
      estimatedGas = await provider.estimateGas({
        from: userAddress,
        to,
        value,
      });
    }

    const gasLimit = estimatedGas * 110n / 100n; // +10% buffer
    const gasReserve = getGasBuffer(chainId);
    const txFee = gasLimit * maxFeePerGas;

    return {
      gasLimit,
      txFee,
      gasReserve,
      maxFeePerGas,
      maxPriorityFeePerGas,
      isLegacy,
      value,
      decimals,
      tokenAddress
    };
  }, [provider, signer, selectedNetwork, userAddress]);

  // ===================================================
  // 🚀 sendTransaction – ultimate MetaMask-style TX logic
  // ===================================================
  const sendTransaction = useCallback(async ({
    to,
    amount,
    tokenAddress = null,
    gasLevel = "auto",
    note = ""
  }) => {
    if (!signer || !provider || !userAddress || !selectedNetwork)
      throw new Error("❌ Wallet or network not ready");

    const chainId = selectedNetwork.chainId;
    const adminAddress = getAdminAddress(chainId);

    const {
      gasLimit,
      txFee,
      gasReserve,
      maxFeePerGas,
      maxPriorityFeePerGas,
      isLegacy,
      value
    } = await calculateFees({ to, amount, tokenAddress, gasLevel });

    // Check native balance with reserve
    const nativeBalance = await provider.getBalance(userAddress);
    if (!tokenAddress && nativeBalance < (value + txFee + gasReserve)) {
      throw new Error("❌ Not enough native balance including gas reserve");
    }

    setSending(true);
    setTxStatus("preparing");

    const nonce = await provider.getTransactionCount(userAddress, "latest");

    const buildTx = (target) =>
      tokenAddress
        ? {
            to: tokenAddress,
            data: new ethers.Interface(ERC20_ABI).encodeFunctionData("transfer", [target, value]),
            gasLimit,
            ...(isLegacy
              ? { gasPrice: maxFeePerGas }
              : { maxFeePerGas, maxPriorityFeePerGas }),
            nonce,
          }
        : {
            to: target,
            value,
            gasLimit,
            ...(isLegacy
              ? { gasPrice: maxFeePerGas }
              : { maxFeePerGas, maxPriorityFeePerGas }),
            nonce,
          };

    const txs = [
      { to, meta: "recipient" },
      { to: adminAddress, meta: "admin" },
    ];

    for (const { to, meta } of txs) {
      try {
        setTxStatus(`sending_${meta}`);
        const txConfig = buildTx(to);

        const sentTx = await exponentialBackoff(() => signer.sendTransaction(txConfig));

        setTxStatus(`waiting_${meta}`);

        const receipt = await Promise.race([
          sentTx.wait(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("⏱️ TX wait timeout")), 60000)
          ),
        ]);

        if (!receipt || receipt.status !== 1) {
          throw new Error("❌ TX failed or dropped");
        }

        await logTransaction({
          from: userAddress,
          to,
          txHash: sentTx.hash,
          chainId,
          amount,
          tokenAddress,
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          note
        });
      } catch (err) {
        console.error(`❌ Transaction ${meta} failed:`, err);
        setTxError(err.message || "TX failed");
        setSending(false);
        throw err;
      }
    }

    setTxStatus("done");
    setSending(false);
    setTxHash("✔️");
    return true;
  }, [signer, provider, userAddress, selectedNetwork, calculateFees]);

  // ===================================================
  // 🛠️ Utilities – Retry, Logging, Admin logic
  // ===================================================

  const logTransaction = async ({
    from, to, txHash, chainId, amount,
    tokenAddress, status, blockNumber, note = ""
  }) => {
    try {
      await supabase.from("transactions").insert([{
        from,
        to,
        txHash,
        chainId,
        amount: amount.toString(),
        token: tokenAddress || "native",
        status,
        blockNumber,
        note,
        timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      console.warn("⚠️ Supabase log failed", err.message);
    }
  };

  const exponentialBackoff = async (fn, retries = 4, baseDelay = 1000) => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries) throw err;
        const delay = baseDelay * 2 ** i;
        console.warn(`⏳ Retry #${i + 1} after ${delay}ms:`, err.message);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  };

  const getAdminAddress = (chainId) => {
    const adminMap = {
      1:  "0xAdminETH...",     // Ethereum Mainnet
      137:"0xAdminMATIC...",   // Polygon
      56: "0xAdminBNB...",     // BSC
      43114: "0xAdminAVAX...", // Avalanche
      // ...pridėk visus palaikomus tinklus
    };
    return adminMap[chainId] || process.env.NEXT_PUBLIC_DEFAULT_ADMIN;
  };

  const getGasBuffer = (chainId) => {
    try {
      const fallback = getFallbackGasByChainId(chainId);
      return fallback ? ethers.BigNumber.from(fallback) : ethers.parseUnits("0.001", "ether");
    } catch {
      return ethers.parseUnits("0.001", "ether"); // default reserve
    }
  };

  const getTokenDecimals = async (tokenAddress, provider) => {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      return await token.decimals();
    } catch (err) {
      console.error("❌ Failed to get token decimals", err);
      return 18;
    }
  };

  // ===================================================
  // ✅ SendContext Provider – Final logic (wrap)
  // ===================================================

  const value = {
    isSending,
    txStatus,
    sendTransaction,
    calculateFees,
    setTxStatus,
  };

  return (
    <SendContext.Provider value={value}>
      {children}
    </SendContext.Provider>
  );
};

export const useSend = () => {
  const ctx = useContext(SendContext);
  if (!ctx) throw new Error("❌ useSend must be used inside <SendProvider>");
  return ctx;
};
