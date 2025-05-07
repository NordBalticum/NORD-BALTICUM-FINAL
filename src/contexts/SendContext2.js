"use client";

// ==========================================================
// 🔱 Nord Balticum — FINAL LOCKED SendContext.js v1.0
// ✅ AES-GCM | ERC20 | Fallback RPC | 2x TX | Retry | Fee 2.97%
// ✅ MetaMask-grade EVM+ERC20 support across 30+ chains
// ==========================================================

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

// =======================================
// 🧬 ERC20 ABI – minimal
// =======================================
const ERC20_ABI = [
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint)",
];

// =======================================
// 🔐 AES-GCM dešifravimas (naudojamas privKey)
// =======================================
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

async function decryptPrivateKey(ciphertext) {
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
// 🔁 Exponential backoff + timeout (anti-DDOS / retry)
// =======================================
async function retryWithBackoff(fn, retries = 4, baseDelay = 1000) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("⏱️ Timeout exceeded")), 30000)
        )
      ]);
    } catch (err) {
      if (i === retries) throw err;
      const delay = baseDelay * 2 ** i;
      console.warn(`🔁 Retry ${i + 1}/${retries} in ${delay}ms`, err.message);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

// =======================================
// ⛽ Gas tier presets (MetaMask-like) + auto-detect
// =======================================
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

// =======================================
// ⛽ Gauti gas fees (EIP-1559 + legacy)
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
// ⛽ Per-network fallback GAS rezervas
// =======================================
function getGasBuffer(chainId) {
  const fallback = getFallbackGasByChainId(chainId);
  return fallback ? BigInt(fallback) : ethers.parseUnits("0.001", "ether");
}

// =======================================
// 🌐 Konteksto pradžia
// =======================================
const SendContext = createContext();

export const useSend = () => {
  const ctx = useContext(SendContext);
  if (!ctx) throw new Error("❌ useSend turi būti naudojamas su <SendProvider>");
  return ctx;
};

export const SendProvider = ({ children }) => {
  const { address: userAddress, encryptedPk } = useAuth();
  const { selectedNetwork } = useNetwork();
  const { refreshBalance } = useBalance();

  const [sending, setSending] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txError, setTxError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [feeLevel, setFeeLevel] = useState("avg");

  const provider = useMemo(
    () => selectedNetwork ? getProviderForChain(selectedNetwork.chainId) : null,
    [selectedNetwork]
  );

  const [signer, setSigner] = useState(null);

  useEffect(() => {
    const loadSigner = async () => {
      if (!provider || !encryptedPk) return setSigner(null);
      try {
        const rawKey = await decryptPrivateKey(encryptedPk);
        const wallet = new ethers.Wallet(rawKey, provider);
        setSigner(wallet);
      } catch (err) {
        console.error("❌ Nepavyko dešifruoti rakto:", err.message);
        setSigner(null);
      }
    };
    loadSigner();
  }, [provider, encryptedPk]);

  // =======================================
  // 💸 calculateFees – gas + 2.97% + buffer
  // =======================================
  const calculateFees = useCallback(async ({
    receiver,
    amount,
    tokenAddress = null,
    gasLevel = feeLevel,
  }) => {
    if (!provider || !signer || !selectedNetwork || !userAddress)
      throw new Error("❌ Trūksta tinklo ar paskyros");

    if (!ethers.isAddress(receiver)) throw new Error("❌ Neteisingas gavėjo adresas");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      throw new Error("❌ Netinkama suma");

    const chainId = selectedNetwork.chainId;
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

    const gasEstimateTx = contract
      ? await contract.connect(signer).estimateGas.transfer(receiver, value).catch(() => 60000n)
      : await provider.estimateGas({
          from: userAddress,
          to: receiver,
          value,
        }).catch(() => 21000n);

    const gasLimit = gasEstimateTx * 110n / 100n;
    const oneTxFee = gasLimit * fees.maxFeePerGas;
    const totalGasFee = oneTxFee * 2n; // admin + recipient
    const adminFee = (value * 297n) / 10000n;
    const totalFee = tokenAddress
      ? totalGasFee
      : value + adminFee + totalGasFee + gasReserve;

    return {
      gasLimit,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      isLegacy: fees.isLegacy,
      totalGasFee,
      adminFee,
      totalFee,
      value,
      decimals,
    };
  }, [provider, signer, selectedNetwork, userAddress, feeLevel]);

  // =======================================
  // ✈️ sendTransaction – admin + recipient TX
  // =======================================
  const sendTransaction = useCallback(async ({
    receiver,
    amount,
    tokenAddress = null,
    note = "",
  }) => {
    if (!signer || !provider || !userAddress || !selectedNetwork)
      throw new Error("❌ Siuntimo sistema neparuošta");

    const chainId = selectedNetwork.chainId;
    const adminAddress = getAdminAddress(chainId);

    const {
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      isLegacy,
      totalGasFee,
      adminFee,
      totalFee,
      value,
      decimals,
    } = await calculateFees({ receiver, amount, tokenAddress });

    // ✅ Balansų tikrinimas
    const nativeBalance = await provider.getBalance(userAddress);

    if (!tokenAddress && nativeBalance < totalFee)
      throw new Error("❌ Nepakanka lėšų (suma + mokesčiai)");

    if (tokenAddress) {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const bal = await token.balanceOf(userAddress);
      if (bal < (value + adminFee))
        throw new Error("❌ Nepakanka ERC20 balanso (suma + 2.97%)");

      if (nativeBalance < totalGasFee)
        throw new Error("❌ Nepakanka native lėšų gas mokesčiams");
    }

    setSending(true);
    setTxStatus("preparing");

    const nonce = await provider.getTransactionCount(userAddress, "latest");

    const buildTx = (to, val, currentNonce) =>
      tokenAddress
        ? {
            to: tokenAddress,
            data: new ethers.Interface(ERC20_ABI).encodeFunctionData("transfer", [to, val]),
            gasLimit,
            nonce: currentNonce,
            ...(isLegacy
              ? { gasPrice: maxFeePerGas }
              : { maxFeePerGas, maxPriorityFeePerGas }),
          }
        : {
            to,
            value: val,
            gasLimit,
            nonce: currentNonce,
            ...(isLegacy
              ? { gasPrice: maxFeePerGas }
              : { maxFeePerGas, maxPriorityFeePerGas }),
          };

    const txs = [
      { to: receiver, amount: value, meta: "recipient", nonce: nonce },
      { to: adminAddress, amount: adminFee, meta: "admin", nonce: nonce + 1 },
    ];

    for (const { to, amount, meta, nonce } of txs) {
      try {
        setTxStatus(`sending_${meta}`);
        const tx = await retryWithBackoff(() =>
          signer.sendTransaction(buildTx(to, amount, nonce))
        );

        setTxStatus(`waiting_${meta}`);
        const receipt = await Promise.race([
          tx.wait(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("⏱️ TX timeout")), 60000)
          ),
        ]);

        if (!receipt || receipt.status !== 1)
          throw new Error(`❌ ${meta} transakcija atmesta arba dropped`);

        await logTransaction({
          from: userAddress,
          to,
          txHash: tx.hash,
          chainId,
          amount: ethers.formatUnits(amount, decimals),
          tokenAddress,
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          note,
        });

        if (meta === "recipient") setTxHash(tx.hash);
      } catch (err) {
        console.error(`❌ Klaida siunčiant ${meta}:`, err.message);
        setTxError(err.message || "Transakcija nepavyko");
        setTxStatus("error");
        setSending(false);
        throw err;
      }
    }

    setTxStatus("done");
    setSending(false);
    toast.success("✅ Pavedimas sėkmingas");
    refreshBalance();
    return true;
  }, [signer, provider, userAddress, selectedNetwork, calculateFees, refreshBalance]);

  // =======================================
  // 🧾 logTransaction – įrašymas į supabase
  // =======================================
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
      console.warn("⚠️ Nepavyko įrašyti į supabase:", err.message);
    }
  };

  // =======================================
  // 🎯 Konteksto reikšmės
  // =======================================
  const value = {
    sending,
    txStatus,
    txHash,
    txError,
    feeLevel,
    setFeeLevel,
    calculateFees,
    sendTransaction,
  };

  return (
    <SendContext.Provider value={value}>
      {children}
    </SendContext.Provider>
  );
};

// =======================================
// 🛡️ useSend saugiklis
// =======================================
export const useSend = () => {
  const ctx = useContext(SendContext);
  if (!ctx) throw new Error("❌ useSend turi būti naudojamas su <SendProvider>");
  return ctx;
};

// =======================================
// ✅ Eksportai
// =======================================
export {
  SendProvider,
  useSend,
};
