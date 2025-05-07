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
// 🔁 Retry su exponential backoff (iki 5 kartų)
// ==========================================
async function executeWithRetry(fn, maxRetries = 5) {
  let attempt = 0;
  let delay = 2000;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable =
        err?.message?.includes("network") ||
        err?.message?.includes("timeout") ||
        err?.message?.includes("replacement transaction underpriced") ||
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
// 🔋 PILNAS Fallback GAS rezervas 30+ tinklų
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
// 🧠 Konteksto kūrimas ir pradinis state
// ==========================================
const SendContext = createContext();
export const useSend = () => useContext(SendContext);

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
  // 💸 GAS + ADMIN FEE SKAIČIAVIMAS (AUTO + Buffer)
  // ==========================================
  const calculateFees = useCallback(async (to, amount, gasLevel = "auto") => {
    setFeeError(null);

    if (!chainId) return setFeeError("❌ Nepasirinktas tinklas");
    if (!ethers.isAddress(to?.trim())) return setFeeError("❌ Neteisingas adresas");

    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return setFeeError("❌ Neteisinga suma");

    setFeeLoading(true);

    try {
      const provider = getProviderForChain(chainId);
      const { maxPriorityFeePerGas, maxFeePerGas } = await getGasFees(provider, gasLevel);

      const weiValue = ethers.parseEther(parsed.toString());
      const weiAdmin = (weiValue * 297n) / 10000n;

      const [rawGasAdmin, rawGasMain] = await Promise.all([
        provider.estimateGas({ to: process.env.NEXT_PUBLIC_ADMIN_WALLET, value: weiAdmin }).catch(() => 21000n),
        provider.estimateGas({ to, value: weiValue }).catch(() => 21000n),
      ]);

      const gasLimitAdmin = rawGasAdmin * 11n / 10n; // +10%
      const gasLimitMain = rawGasMain * 11n / 10n;   // +10%
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
  }, [chainId]);

  // ==========================================
  // ✈️ VYKDOMA TRANSAKCIJA (ADMIN + RECIPIENT)
  // ==========================================
  const sendTransaction = useCallback(
    async ({ to, amount, userEmail, gasLevel = "auto" }) => {
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

        const parsedAmount = Number(amount);
        const weiValue = ethers.parseEther(parsedAmount.toString());
        const weiAdmin = (weiValue * 297n) / 10000n;

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

        const [rawGasAdmin, rawGasMain] = await Promise.all([
          provider.estimateGas({ to: ADMIN, value: weiAdmin }).catch(() => 21000n),
          provider.estimateGas({ to: recipient, value: weiValue }).catch(() => 21000n),
        ]);

        const gasLimitAdmin = rawGasAdmin * 11n / 10n;
        const gasLimitMain = rawGasMain * 11n / 10n;
        const gasTotal = maxFeePerGas * (gasLimitAdmin + gasLimitMain);
        const reserve = getGasBuffer(chainId);

        const balance = await provider.getBalance(walletAddress || signer.address);
        const totalCost = weiValue + weiAdmin + gasTotal + reserve;

        if (balance < totalCost) {
          throw new Error("❌ Nepakanka lėšų (įskaitant mokesčius)");
        }

        const nonce = await getSafeNonce(provider, signer.address);

        // 1️⃣ Admin fee
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
          await txAdmin.wait();
        } catch (err) {
          console.warn("⚠️ Admin fee klaida:", err.message);
        }

        // 2️⃣ Recipient
        const tx = await executeWithRetry(() =>
          signer.sendTransaction({
            to: recipient,
            value: weiValue,
            gasLimit: gasLimitMain,
            maxPriorityFeePerGas,
            maxFeePerGas,
            nonce: nonce + 1,
          })
        );

        const receipt = await tx.wait();

        if (!tx?.hash || receipt?.status !== 1) {
          const dropped = await isDroppedOrReplaced(provider, tx?.hash);
          const errorMsg = dropped
            ? "❌ Transakcija buvo dropped ar replaced"
            : "❌ Transakcija nesėkminga";

          await supabase.from("logs").insert([{
            user_email: userEmail,
            type: "transaction_error",
            message: errorMsg,
          }]);

          throw new Error(errorMsg);
        }

        // 📦 Supabase – transakcijos log'as
        await supabase.from("transactions").insert([{
          user_email: userEmail,
          sender_address: signer.address,
          receiver_address: recipient,
          amount: parsedAmount,
          fee: Number(ethers.formatEther(weiAdmin)),
          network: activeNetwork,
          type: "send",
          tx_hash: tx.hash,
        }]);

        toast.success("✅ Pavedimas sėkmingas!", {
          position: "top-center",
          autoClose: 3000,
        });

        await refetch();
        return tx.hash;

      } catch (err) {
        console.error("❌ Pavedimo klaida:", err);

        await supabase.from("logs").insert([{
          user_email: userEmail,
          type: "transaction_error",
          message: err.message || "Nežinoma siuntimo klaida",
        }]);

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
  // ✅ Konteksto tiekimas visai aplikacijai
  // ==========================================
  return (
    <SendContext.Provider
      value={{
        // ✈️ Pavedimų funkcija su retry (admin + recipient)
        sendTransaction,

        // 🔄 Ar šiuo metu vykdomas siuntimas
        sending,

        // 🧮 GAS + Admin fee skaičiavimas
        calculateFees,

        // 💸 Atskirai grąžinami mokesčiai
        gasFee,     // ⛽ Tikras gas fee
        adminFee,   // 💸 2.97% admin fee
        totalFee,   // 💰 GAS + admin bendra suma

        // 🔁 Mokesčių kraunimo būsena ir klaidos
        feeLoading,
        feeError,
      }}
    >
      {children}
    </SendContext.Provider>
  );
}

// ==========================================
// 🛡️ Send konteksto eksportas su saugikliu
// ==========================================
export const useSend = () => {
  const context = useContext(SendContext);
  if (!context) {
    throw new Error("❌ useSend turi būti naudojamas su <SendProvider>");
  }
  return context;
};

// ==========================================
// ✅ EXPORTAS – pilnai integruojamas provideris
// ==========================================
export { SendProvider };
