"use client";

// ===============================================
// 🔱 Nord Balticum – Ultimate SendContext.js – PART 1/6
// ✅ AES-GCM Decryption | 2.97% Fee | Gas Estimation | Fallbacks
// ✅ MetaMask-grade logic with ERC20 + Native support
// ===============================================

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

// ===============================================
// 🧬 Minimal ERC20 ABI
// ===============================================
const ERC20_ABI = [
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint)"
];

// ===============================================
// 🔐 AES-GCM Decryption
// ===============================================
const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

async function getKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret) throw new Error("❌ Missing AES key in .env");

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

// ===============================================
// 🔁 Exponential Retry with Timeout
// ===============================================
async function executeWithRetry(fn, maxRetries = 5, timeoutMs = 30000) {
  let attempt = 0;
  let delay = 2000;

  while (attempt < maxRetries) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("⏱️ TX timeout")), timeoutMs)
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

// ===============================================
// ⛽ Gas Presets + Auto Gas Tier
// ===============================================
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

// ===============================================
// ⛽ Gauti Gas Fees (EIP-1559 arba Legacy)
// ===============================================
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

// ===============================================
// 🛡️ Gauti admin adresą pagal chainId
// ===============================================
function getAdminAddress(chainId) {
  const adminMap = {
    1: "0xAdminETH...",
    137: "0xAdminMATIC...",
    56: "0xAdminBNB...",
    43114: "0xAdminAVAX...",
    10: "0xAdminOP...",
    42161: "0xAdminARB...",
    8453: "0xAdminBASE...",
    324: "0xAdminZKSYNC...",
    59144: "0xAdminLINEA...",
    5000: "0xAdminMANTLE...",
    534352: "0xAdminSCROLL...",
    42220: "0xAdminCELO...",
    1284: "0xAdminMOONBEAM...",
    1313161554: "0xAdminAURORA...",
    100: "0xAdminGNOSIS...",
    122: "0xAdminFUSE...",
    250: "0xAdminFTM...",
    9001: "0xAdminEVMOS...",
    2222: "0xAdminKAVA...",
    66: "0xAdminOKX...",
    32520: "0xAdminBRISE...",
    1116: "0xAdminCORE...",
    2000: "0xAdminDOGE...",
    40: "0xAdminTELOS...",
    365: "0xAdminTHETA...",
    24: "0xAdminKARDIA...",
    42262: "0xAdminOASIS...",
    30: "0xAdminRSK...",
    2109: "0xAdminEXOSAMA...",
    88002: "0xAdminLUXY...",
    88: "0xAdminTOMO...",
    820: "0xAdminCALLISTO...",
    39797: "0xAdminENERGI...",
    7700: "0xAdminCANTO...",
    1337: "0xAdminTALLY...",
    106: "0xAdminVELAS...",
    71402: "0xAdminGODWOKEN...",
    1088: "0xAdminMETIS...",
    25: "0xAdminCRONOS...",
    47805: "0xAdminREI...",
    7777777: "0xAdminZORA...",
    7000: "0xAdminZETA...",
    42766: "0xAdminZKFAIR...",
    // ... papildomai
  };
  return adminMap[chainId] || process.env.NEXT_PUBLIC_DEFAULT_ADMIN;
}

// ===============================================
// ⛽ Gauti rezervinį gas limitą per chainId
// ===============================================
function getGasBuffer(chainId) {
  return getFallbackGasByChainId(chainId);
}

// ===============================================
// 💸 calculateFees – apskaičiuoja gas + 2.97% + rezervą
// ===============================================
const calculateFees = async ({
  provider,
  signer,
  walletAddress,
  receiver,
  amount,
  tokenAddress = null,
  chainId,
  gasLevel = "auto"
}) => {
  if (!provider || !signer || !walletAddress || !receiver || !amount || !chainId)
    throw new Error("Missing data for fee calculation");

  const fees = await getGasFees(provider, gasLevel);
  const gasReserve = getGasBuffer(chainId);

  let decimals = 18;
  let value = ethers.parseUnits(amount, 18);
  let contract = null;

  if (tokenAddress) {
    contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    decimals = await contract.decimals();
    value = ethers.parseUnits(amount, decimals);
  }

  // Estimate gas for ONE transfer
  const estimatedGas = contract
    ? await contract.connect(signer).estimateGas.transfer(receiver, value)
    : await provider.estimateGas({
        from: walletAddress,
        to: receiver,
        value,
      });

  const gasLimit = estimatedGas * 110n / 100n; // +10% buffer
  const oneTxFee = gasLimit * fees.maxFeePerGas;
  const totalGasFee = oneTxFee * 2n; // admin + recipient

  const adminFee = (value * 297n) / 10000n; // 2.97%
  const totalWithAdmin = value + adminFee;

  const totalFee = totalGasFee + gasReserve + (tokenAddress ? 0n : totalWithAdmin); // native requires funds for amount+fee

  return {
    gasLimit,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    isLegacy: fees.isLegacy,
    totalGasFee,
    adminFee,
    totalWithAdmin,
    totalFee,
    value,
    decimals,
    tokenAddress
  };
};

// ===============================================
// 🚀 sendTransaction – 2x TX: recipient + admin
// ===============================================
const sendTransaction = async ({
  provider,
  signer,
  walletAddress,
  chainId,
  receiver,
  amount,
  tokenAddress = null,
  gasLevel = "auto",
  note = ""
}) => {
  if (!signer || !provider || !walletAddress || !receiver || !chainId)
    throw new Error("Transaction config missing");

  const adminAddress = getAdminAddress(chainId);

  const {
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    isLegacy,
    totalGasFee,
    adminFee,
    totalWithAdmin,
    value,
    decimals,
    totalFee
  } = await calculateFees({
    provider,
    signer,
    walletAddress,
    receiver,
    amount,
    tokenAddress,
    chainId,
    gasLevel
  });

  const nativeBalance = await provider.getBalance(walletAddress);

  if (!tokenAddress && nativeBalance < totalFee) {
    throw new Error("❌ Insufficient native balance for amount + fees + buffer");
  }

  if (tokenAddress) {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const tokenBal = await token.balanceOf(walletAddress);
    if (tokenBal < totalWithAdmin) {
      throw new Error("❌ Insufficient token balance (amount + admin fee)");
    }

    if (nativeBalance < totalGasFee) {
      throw new Error("❌ Insufficient native token for gas fees");
    }
  }

  const nonce = await provider.getTransactionCount(walletAddress, "latest");

  const buildTx = (to, amountToSend) => {
    if (tokenAddress) {
      return {
        to: tokenAddress,
        data: new ethers.Interface(ERC20_ABI).encodeFunctionData("transfer", [to, amountToSend]),
        gasLimit,
        ...(isLegacy
          ? { gasPrice: maxFeePerGas }
          : {
              maxFeePerGas,
              maxPriorityFeePerGas,
            }),
        nonce,
      };
    } else {
      return {
        to,
        value: amountToSend,
        gasLimit,
        ...(isLegacy
          ? { gasPrice: maxFeePerGas }
          : {
              maxFeePerGas,
              maxPriorityFeePerGas,
            }),
        nonce,
      };
    }
  };

  const txs = [
    { to: receiver, amount: value, meta: "recipient" },
    { to: adminAddress, amount: adminFee, meta: "admin" }
  ];

  for (let i = 0; i < txs.length; i++) {
    const { to, amount, meta } = txs[i];

    const txData = buildTx(to, amount);
    if (i === 1) txData.nonce = nonce + 1; // second tx manually sets next nonce

    const sentTx = await exponentialBackoff(() =>
      signer.sendTransaction(txData)
    );

    const receipt = await Promise.race([
      sentTx.wait(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout waiting for ${meta} tx`)), 60000)
      )
    ]);

    if (!receipt || receipt.status !== 1)
      throw new Error(`❌ ${meta} transaction dropped or failed`);

    await logTransaction({
      from: walletAddress,
      to,
      txHash: sentTx.hash,
      chainId,
      amount: ethers.formatUnits(amount, decimals),
      tokenAddress,
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      note
    });
  }

  return { success: true };
};

// ===============================================
// 🛠️ Pagalbinės funkcijos – logging, retry, adresai
// ===============================================

const logTransaction = async ({
  from,
  to,
  txHash,
  chainId,
  amount,
  tokenAddress,
  status,
  blockNumber,
  note = ""
}) => {
  try {
    await supabase.from("transactions").insert([{
      from,
      to,
      txHash,
      chainId,
      amount,
      token: tokenAddress || "native",
      status,
      blockNumber,
      note,
      timestamp: new Date().toISOString()
    }]);
  } catch (err) {
    console.warn("⚠️ Supabase log failed:", err.message);
  }
};

const exponentialBackoff = async (fn, retries = 4, delay = 1500) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      const wait = delay * 2 ** i;
      console.warn(`🔁 Retry [${i + 1}/${retries}] in ${wait}ms`, err.message);
      await new Promise((res) => setTimeout(res, wait));
    }
  }
};

const getAdminAddress = (chainId) => {
  const adminMap = {
    1:     "0xAdminETH...",
    137:   "0xAdminMATIC...",
    56:    "0xAdminBNB...",
    43114: "0xAdminAVAX...",
    10:    "0xAdminOP...",
    42161: "0xAdminARB...",
    8453:  "0xAdminBASE...",
    324:   "0xAdminZKSYNC...",
    59144: "0xAdminLINEA...",
    5000:  "0xAdminMANTLE...",
    534352:"0xAdminSCROLL...",
    42220: "0xAdminCELO...",
    1284:  "0xAdminMOONBEAM...",
    1313161554: "0xAdminAURORA...",
    100:   "0xAdminGNOSIS...",
    122:   "0xAdminFUSE...",
    250:   "0xAdminFANTOM...",
    9001:  "0xAdminEVMOS...",
    2222:  "0xAdminKAVA...",
    66:    "0xAdminOKX...",
    32520: "0xAdminBITGERT...",
    1116:  "0xAdminCOREDAO...",
    2000:  "0xAdminDOGECHAIN...",
    40:    "0xAdminTELOS...",
    365:   "0xAdminTHETA...",
    24:    "0xAdminKARDIA...",
    42262: "0xAdminOASIS...",
    30:    "0xAdminRSK...",
    2109:  "0xAdminEXOSAMA...",
    88002: "0xAdminLUXY...",
    88:    "0xAdminTOMO...",
    820:   "0xAdminCALLISTO...",
    39797: "0xAdminENERGI...",
    7700:  "0xAdminCANTO...",
    1337:  "0xAdminTALLY...",
    106:   "0xAdminVELAS...",
    71402: "0xAdminGODWOKEN...",
    1088:  "0xAdminMETIS...",
    25:    "0xAdminCRONOS...",
    47805: "0xAdminREI...",
    7777777:"0xAdminZORA...",
    7000:  "0xAdminZETACHAIN...",
    42766: "0xAdminZKFAIR..."
  };

  return adminMap[chainId] || process.env.NEXT_PUBLIC_DEFAULT_ADMIN;
};

const getGasBuffer = (chainId) => {
  const fallback = getFallbackGasByChainId(chainId);
  return fallback || ethers.parseUnits("0.002", "ether"); // universal fallback
};

// ===============================================
// ✅ SendContext Provider – su viskuo (admin, errorai, fee valdymas)
// ===============================================

export const SendContext = createContext();

export const SendProvider = ({ children }) => {
  const { address: userAddress, encryptedPk } = useAuth();
  const { selectedNetwork } = useNetwork();
  const { balances, refreshBalance } = useBalance();

  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");
  const [txStatus, setTxStatus] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [feeLevel, setFeeLevel] = useState("avg");

  const provider = useMemo(() => selectedNetwork ? getProviderForChain(selectedNetwork.chainId) : null, [selectedNetwork]);

  const signer = useMemo(() => {
    if (!provider || !encryptedPk) return null;
    try {
      const decrypt = async () => {
        const raw = await decryptKey(encryptedPk);
        return new ethers.Wallet(raw, provider);
      };
      return decrypt();
    } catch (err) {
      console.error("❌ Signer decrypt failed", err.message);
      return null;
    }
  }, [provider, encryptedPk]);

  const estimateFees = useCallback(async ({
    receiver,
    amount,
    tokenAddress = null
  }) => {
    if (!provider || !signer || !selectedNetwork) return;

    try {
      setTxError("");
      setGasEstimate(null);

      const {
        gasLimit,
        txFee,
        gasReserve,
        maxFeePerGas,
        maxPriorityFeePerGas,
        isLegacy,
        value,
        decimals,
        adminFee,
        totalFee
      } = await calculateFees({
        receiver,
        amount,
        tokenAddress,
        gasLevel: feeLevel
      });

      setGasEstimate({
        gasLimit,
        txFee,
        gasReserve,
        totalFee,
        adminFee,
        maxFeePerGas,
        maxPriorityFeePerGas,
        isLegacy,
        decimals,
        value
      });
    } catch (err) {
      console.error("⛽ Fee estimation failed:", err.message);
      setTxError("Fee estimation error");
    }
  }, [provider, signer, selectedNetwork, feeLevel]);

  const send = useCallback(async ({
    receiver,
    amount,
    tokenAddress = null,
    note = ""
  }) => {
    if (!provider || !signer || !selectedNetwork) return;

    setSending(true);
    setTxError("");
    setTxHash("");
    setTxStatus("preparing");

    try {
      const success = await sendTransaction({
        signer: await signer,
        provider,
        receiver,
        amount,
        tokenAddress,
        chainId: selectedNetwork.chainId,
        walletAddress: userAddress,
        gasLevel: feeLevel,
        note
      });

      if (success === true) {
        setTxStatus("done");
        refreshBalance();
      }
    } catch (err) {
      console.error("🚨 Send error:", err.message);
      setTxError(err.message || "Unexpected send error");
      setTxStatus("error");
    } finally {
      setSending(false);
    }
  }, [signer, provider, selectedNetwork, userAddress, feeLevel]);

  const value = {
    sending,
    txStatus,
    txHash,
    txError,
    feeLevel,
    setFeeLevel,
    gasEstimate,
    estimateFees,
    send
  };

  return <SendContext.Provider value={value}>{children}</SendContext.Provider>;
};

export const useSend = () => {
  const ctx = useContext(SendContext);
  if (!ctx) throw new Error("❌ useSend must be used inside <SendProvider>");
  return ctx;
};

// ===============================================
// ✅ FINAL EXPORTS – SendContext
// ===============================================

export {
  SendProvider,
  useSend,
  calculateFees,
  sendTransaction,
  getAdminAddress,
  getGasBuffer,
  getGasFees,
  getTokenDecimals,
  logTransaction,
  exponentialBackoff,
};
