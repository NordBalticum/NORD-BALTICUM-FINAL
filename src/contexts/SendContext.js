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
// ⛽ GAS PRESET'AI KAIP METAMASK
// ==========================================
const GAS_PRESETS = {
  slow: { priority: "1", max: "20" },
  avg:  { priority: "2", max: "30" },
  fast: { priority: "4", max: "50" },
};

// GAS rezervas kiekvienam tinklui (native valiuta)
const fallbackGasReserve = {
  1:  ethers.parseEther("0.0005"), // Ethereum Mainnet
  56: ethers.parseUnits("0.002", "ether"), // BNB
  137: ethers.parseUnits("0.3", "ether"),  // Matic
  43114: ethers.parseUnits("0.01", "ether"), // AVAX
  10: ethers.parseEther("0.0005"), // Optimism
  42161: ethers.parseEther("0.0005"), // Arbitrum
  11155111: ethers.parseEther("0.0005"), // Sepolia
  97: ethers.parseUnits("0.002", "ether"), // BNB Testnet
  80001: ethers.parseUnits("0.3", "ether"), // Mumbai
  43113: ethers.parseUnits("0.01", "ether"), // Fuji
};

// Dinamiškas gas rezervas pagal tinklo chainId
function getGasBuffer(chainId) {
  return fallbackGasReserve[chainId] ?? ethers.parseEther("0.0005");
}

// ==========================================
// 📈 GAS FEE DUOMENŲ GAVIMAS (MetaMask-style)
// ==========================================
async function getGasFees(provider, level = "avg") {
  const preset = GAS_PRESETS[level] || GAS_PRESETS.avg;

  try {
    // Eth_getPriorityFeePerGas tik EIP-1559 tikslumui (kai palaikoma)
    const ethPriority = await provider.send("eth_maxPriorityFeePerGas", []);
    const maxPriorityFeePerGas = ethPriority
      ? ethers.BigNumber.from(ethPriority)
      : ethers.parseUnits(preset.priority, "gwei");

    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas ?? ethers.parseUnits(preset.max, "gwei");

    return { maxPriorityFeePerGas, maxFeePerGas };
  } catch (err) {
    console.warn("⚠️ getGasFees fallback mode:", err.message);
    return {
      maxPriorityFeePerGas: ethers.parseUnits(preset.priority, "gwei"),
      maxFeePerGas: ethers.parseUnits(preset.max, "gwei"),
    };
  }
}

// ==========================================
// 🧠 CONTEXT PRADŽIA
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
  // 💸 GAS + ADMIN FEE SKAIČIAVIMAS
  // ==========================================
  const calculateFees = useCallback(async (to, amount, gasLevel = "avg") => {
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

      const [gasLimitAdmin, gasLimitMain] = await Promise.all([
        provider.estimateGas({ to: process.env.NEXT_PUBLIC_ADMIN_WALLET, value: weiAdmin }).catch(() => 21000n),
        provider.estimateGas({ to, value: weiValue }).catch(() => 21000n),
      ]);

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
    async ({ to, amount, userEmail, gasLevel = "avg" }) => {
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

        const [gasLimitAdmin, gasLimitMain] = await Promise.all([
          provider.estimateGas({ to: ADMIN, value: weiAdmin }).catch(() => 21000n),
          provider.estimateGas({ to: recipient, value: weiValue }).catch(() => 21000n),
        ]);

        const gasTotal = maxFeePerGas * (gasLimitAdmin + gasLimitMain);
        const reserve = getGasBuffer(chainId);

        const balance = await provider.getBalance(walletAddress || signer.address);
        const totalCost = weiValue + weiAdmin + gasTotal + reserve;

        if (balance < totalCost) {
          throw new Error("❌ Nepakanka lėšų (įskaitant mokesčius)");
        }

        try {
          await signer.sendTransaction({
            to: ADMIN,
            value: weiAdmin,
            gasLimit: gasLimitAdmin,
            maxPriorityFeePerGas,
            maxFeePerGas,
          });
        } catch (err) {
          console.warn("⚠️ Admin fee klaida:", err.message);
        }

        const tx = await signer.sendTransaction({
          to: recipient,
          value: weiValue,
          gasLimit: gasLimitMain,
          maxPriorityFeePerGas,
          maxFeePerGas,
        });

        if (!tx?.hash) throw new Error("❌ Transakcija nesugeneravo hash");

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

        toast.success("✅ Pavedimas sėkmingas!", { position: "top-center", autoClose: 3000 });
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
        // ✈️ Funkcija siųsti pavedimą (admin + recipient)
        sendTransaction,

        // ⏱️ Ar šiuo metu vykdomas siuntimas
        sending,

        // 🧮 Funkcija skaičiuoti GAS ir Admin fee
        calculateFees,

        // 💸 Atskirai grąžinami mokesčiai
        gasFee,     // ⛽ Tikras gas mokesčio dydis (ETH, BNB, MATIC...)
        adminFee,   // 💸 2.97% mokestis (ETH-based)
        totalFee,   // 💰 GAS + Admin bendra suma

        // 🔄 Kraunasi mokesčiai
        feeLoading,

        // ❌ Klaida jei nepavyko apskaičiuoti
        feeError,
      }}
    >
      {children}
    </SendContext.Provider>
  );
}
