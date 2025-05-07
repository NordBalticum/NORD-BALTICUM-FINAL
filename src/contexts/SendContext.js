"use client";

// ===================================================
// 🔱 Nord Balticum — FINAL MERGED SendContext.js v3.0
// ✅ AES-GCM | ERC20 | Fallback RPC | 2x TX | Retry
// ✅ MetaMask-grade EVM+ERC20 support across 36+ chains
// ✅ Supabase logging | ActiveSigner fallback
// ===================================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
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
// 🧬 ERC20 ABI – minimal
// =======================================
const ERC20_ABI = [
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint)",
];

// =======================================
// 🔐 AES-GCM dešifravimas
// =======================================
const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

async function getKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret) throw new Error("❌ AES raktas nerastas .env faile");

  const base = await crypto.subtle.importKey(
    "raw", encode(secret),
    { name: "PBKDF2" }, false, ["deriveKey"]
  );

  return crypto.subtle.deriveKey({
    name: "PBKDF2",
    salt: encode("nordbalticum-salt"),
    iterations: 100_000,
    hash: "SHA-256"
  }, base, {
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
        )
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
// ⛽ GAS presetai ir auto lygio parinkimas
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
// ⛽ Gauti gas fees (EIP-1559 + legacy palaikymas)
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
// ⛽ Fallback rezervas kiekvienam tinklui
// =======================================
function getGasBuffer(chainId) {
  const fallback = getFallbackGasByChainId(chainId);
  return fallback ? BigInt(fallback) : ethers.parseUnits("0.001", "ether");
}

// =======================================
// 🔍 Tikrinimas ar TX buvo dropped / replaced
// =======================================
async function isDroppedOrReplaced(provider, txHash) {
  const receipt = await provider.getTransactionReceipt(txHash);
  return !receipt || !receipt.blockNumber;
}

// =======================================
// 🧠 Gauti nonce su fallback (pending vs latest)
// =======================================
async function getSafeNonce(provider, address) {
  const pending = await provider.getTransactionCount(address, "pending");
  const latest = await provider.getTransactionCount(address, "latest");
  return Math.max(pending, latest);
}

// =======================================
// 🔐 Gauti signer: naudoti activeSigner arba decrypt'inti
// =======================================
async function getFallbackSigner(activeSigner, walletAddress, userEmail, provider) {
  if (activeSigner) return activeSigner;

  const { data, error } = await supabase
    .from("wallets")
    .select("encrypted_key")
    .eq("user_email", userEmail)
    .maybeSingle();

  if (error || !data?.encrypted_key) {
    throw new Error("❌ Nerastas šifruotas raktas supabase");
  }

  const privKey = await decryptKey(data.encrypted_key);
  return new ethers.Wallet(privKey, provider);
}

// =======================================
// 💸 calculateFees – gas + 2.97% + rezervas (native + ERC20)
// =======================================
const calculateFees = useCallback(
  async ({ to, amount, gasLevel = "auto", tokenAddress = null }) => {
    setFeeError(null);

    if (!chainId) return setFeeError("❌ Nepasirinktas tinklas");
    if (!ethers.isAddress(to?.trim())) return setFeeError("❌ Neteisingas adresas");

    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return setFeeError("❌ Neteisinga suma");

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
      console.error("⛽ Fee skaičiavimo klaida:", err);
      setFeeError("❌ Klaida skaičiuojant mokesčius");
    } finally {
      setFeeLoading(false);
    }
  },
  [chainId]
);

// =======================================
// 📊 getBalanceFor – gauti balansą (native arba ERC20)
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
// ✈️ sendTransaction – admin + recipient TX su visais saugikliais
// =======================================
const sendTransaction = useCallback(
  async ({ to, amount, userEmail, gasLevel = "auto", tokenAddress = null }) => {
    const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (!ADMIN || !to || !amount || !userEmail || !chainId) {
      throw new Error("❌ Trūksta siuntimo laukų");
    }

    const recipient = to.trim().toLowerCase();
    if (!ethers.isAddress(recipient)) {
      throw new Error("❌ Neteisingas adresas");
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
        const { data, error } = await supabase
          .from("wallets")
          .select("encrypted_key")
          .eq("user_email", userEmail)
          .maybeSingle();

        if (error || !data?.encrypted_key) {
          throw new Error("❌ Nerastas šifruotas raktas");
        }

        const privKey = await decryptKey(data.encrypted_key);
        signer = new ethers.Wallet(privKey, provider);
      }

      // ✅ GAS LIMITS
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
        throw new Error("❌ Nepakanka lėšų (įskaitant gas ir admin fee)");
      }

      const nonce = await getSafeNonce(provider, signer.address);

      // 1️⃣ ADMIN FEE TX
      try {
        const txAdmin = await executeWithRetry(() =>
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
        console.warn("⚠️ Admin fee klaida:", err.message);
      }

      // 2️⃣ MAIN TX
      let tx;
      if (isERC20) {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        tx = await executeWithRetry(() =>
          tokenContract.transfer(recipient, tokenAmount, {
            gasLimit: gasLimitMain,
            maxPriorityFeePerGas,
            maxFeePerGas,
            nonce: nonce + 1,
          })
        );
      } else {
        tx = await executeWithRetry(() =>
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
          setTimeout(() => rej(new Error("⏱️ TX timeout")), 60_000)
        ),
      ]);

      if (!tx?.hash || receipt?.status !== 1) {
        const dropped = await isDroppedOrReplaced(provider, tx?.hash);
        const errorMsg = dropped
          ? "❌ Transakcija buvo dropped/replaced"
          : "❌ Transakcija nesėkminga";

        await supabase.from("logs").insert([
          {
            user_email: userEmail,
            type: "transaction_error",
            message: errorMsg,
          },
        ]);

        throw new Error(errorMsg);
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

      toast.success("✅ Pavedimas sėkmingas!", {
        position: "top-center",
        autoClose: 3000,
      });

      await refetch();
      return tx.hash;
    } catch (err) {
      console.error("❌ Pavedimo klaida:", err);

      await supabase.from("logs").insert([
        {
          user_email: userEmail,
          type: "transaction_error",
          message: err.message || "Nežinoma siuntimo klaida",
        },
      ]);

      toast.error("❌ " + (err.message || "Siuntimas nepavyko"), {
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
// 📊 GAUTI BALANSĄ (native arba ERC20)
// ==========================================
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
}

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
