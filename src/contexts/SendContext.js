"use client";

// ==========================================
// 📦 IMPORTAI – GODMODE ON
// ==========================================
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

// ==========================================
// 🧬 ERC20 ABI – minimalus
// ==========================================
const ERC20_ABI = [
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint)"
];

// ==========================================
// 🔐 AES-GCM ŠIFRAVIMAS / DEŠIFRAVIMAS
// ==========================================
const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

async function getKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret) throw new Error("❌ AES raktas nerastas .env faile");

  const base = await crypto.subtle.importKey(
    "raw", encode(secret),
    { name: "PBKDF2" }, false, ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encode("nordbalticum-salt"),
      iterations: 100_000,
      hash: "SHA-256"
    },
    base,
    { name: "AES-GCM", length: 256 },
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

// ==========================================
// 🔁 Retry su timeout + exponential backoff
// ==========================================
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

// ==========================================
// ⛽ GAS PRESET'AI KAIP METAMASK + AUTO DETECT
// ==========================================
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

// ==========================================
// 🛢️ EIP-1559 arba legacy gas logika
// ==========================================
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
  const level = gasLevel === "auto" ? autoDetectGasLevel(ethers.formatUnits(baseFee, "gwei")) : gasLevel;
  const preset = GAS_PRESETS[level];

  return {
    maxPriorityFeePerGas: ethers.parseUnits(preset.priority, "gwei"),
    maxFeePerGas: ethers.parseUnits(preset.max, "gwei"),
    isLegacy: false,
  };
}

// ==========================================
// 🔋 Fallback GAS rezervas 30+ tinklų
// ==========================================
const fallbackGasReserve = {
  1:  ethers.parseEther("0.0005"), 5: ethers.parseEther("0.0005"), 11155111: ethers.parseEther("0.0005"),
  56: ethers.parseUnits("0.002", "ether"), 97: ethers.parseUnits("0.002", "ether"),
  137: ethers.parseUnits("0.3", "ether"), 80001: ethers.parseUnits("0.3", "ether"),
  43114: ethers.parseUnits("0.01", "ether"), 43113: ethers.parseUnits("0.01", "ether"),
  10: ethers.parseEther("0.0005"), 420: ethers.parseEther("0.0005"),
  42161: ethers.parseEther("0.0005"), 421613: ethers.parseEther("0.0005"),
  42220: ethers.parseUnits("0.001", "ether"), 42261: ethers.parseUnits("0.001", "ether"),
  100: ethers.parseUnits("0.001", "ether"), 250: ethers.parseUnits("0.01", "ether"),
  4002: ethers.parseUnits("0.01", "ether"), 8453: ethers.parseEther("0.0005"),
  84531: ethers.parseEther("0.0005"), 1101: ethers.parseUnits("0.002", "ether"),
  1442: ethers.parseUnits("0.002", "ether"), 324: ethers.parseUnits("0.0005", "ether"),
  280: ethers.parseUnits("0.0005", "ether"), 534352: ethers.parseUnits("0.002", "ether"),
  59144: ethers.parseUnits("0.001", "ether"), 59140: ethers.parseUnits("0.001", "ether"),
  5000: ethers.parseUnits("0.002", "ether"), 5001: ethers.parseUnits("0.002", "ether"),
  1284: ethers.parseUnits("0.001", "ether"), 1313161554: ethers.parseUnits("0.002", "ether"),
  888: ethers.parseUnits("0.001", "ether")
};

function getGasBuffer(chainId) {
  return fallbackGasReserve[chainId] ?? ethers.parseEther("0.0005");
}

// ==========================================
// 🔍 Tikrinimas ar TX buvo dropped ar replaced
// ==========================================
async function isDroppedOrReplaced(provider, txHash) {
  const receipt = await provider.getTransactionReceipt(txHash);
  return !receipt || !receipt.blockNumber;
}

// ==========================================
// 🧠 Gauti nonce su fallback kaip MetaMask
// ==========================================
async function getSafeNonce(provider, address) {
  const pending = await provider.getTransactionCount(address, "pending");
  const latest = await provider.getTransactionCount(address, "latest");
  return Math.max(pending, latest);
}

// ==========================================
// 💰 ERC20 Token balanso tikrinimas (balanceOf)
// ==========================================
async function getTokenBalance(tokenAddress, userAddress, provider) {
  if (!ethers.isAddress(tokenAddress)) return null;
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const decimals = await token.decimals();
  const balance = await token.balanceOf(userAddress);
  return Number(ethers.formatUnits(balance, decimals));
}

// ==========================================
// 🎯 Send konteksto kūrimas
// ==========================================
const SendContext = createContext();
export const useSend = () => {
  const context = useContext(SendContext);
  if (!context) {
    throw new Error("❌ useSend turi būti naudojamas su <SendProvider>");
  }
  return context;
};

export function SendProvider({ children }) {
  const { safeRefreshSession } = useAuth();
  const { refetch } = useBalance();
  const { activeNetwork, chainId } = useNetwork();
  const activeSigner = useActiveSigner();
  const walletAddress = useWalletAddress();

  const [sending, setSending] = useState(false);
  const [gasFee, setGasFee] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState(null);

  // ==========================================
  // ⛽ EIP-1559 ar legacy: gas fee automatinis gavimas
  // ==========================================
  async function getGasFees(provider, gasLevel = "auto") {
    const feeData = await provider.getFeeData();
    const baseFeeGwei = ethers.formatUnits(
      feeData.lastBaseFeePerGas || feeData.gasPrice || "0",
      "gwei"
    );

    const level = gasLevel === "auto" ? autoDetectGasLevel(baseFeeGwei) : gasLevel;
    const preset = GAS_PRESETS[level] || GAS_PRESETS.avg;

    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      return {
        maxFeePerGas: ethers.parseUnits(preset.max, "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits(preset.priority, "gwei"),
      };
    } else {
      const legacyGasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei");
      return {
        maxFeePerGas: legacyGasPrice,
        maxPriorityFeePerGas: legacyGasPrice,
      };
    }
  }

  // ==========================================
  // 💸 GAS + ADMIN FEE SKAIČIAVIMAS (native arba ERC20)
  // ==========================================
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

  // ==========================================
  // ✈️ TRANSAKCIJA: ADMIN + NATIVE arba ERC20
  // ==========================================
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

        // 1️⃣ ADMIN FEE (ETH)
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

        // 2️⃣ PAGRINDINIS PAVEDIMAS (native arba ERC20)
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

        // 🧾 SUPABASE TRANSAKCIJOS LOGAS
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
// ✅ Eksportas
// ==========================================
export { SendProvider };
