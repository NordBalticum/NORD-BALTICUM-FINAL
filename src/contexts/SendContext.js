"use client";

// ==========================================
// 📦 Importai
// ==========================================
import { createContext, useContext, useState, useCallback } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useActiveSigner, useWalletAddress } from "@/utils/walletHelper";
import { getProviderForChain } from "@/utils/getProviderForChain";

// ==========================================
// 🧠 Konteksto kūrimas
// ==========================================
const SendContext = createContext();
export const useSend = () => useContext(SendContext);

// ==========================================
// 🔐 AES-GCM dešifravimas
// ==========================================
const encode = (txt) => new TextEncoder().encode(txt);
const decode = (buf) => new TextDecoder().decode(buf);

async function getKey() {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret) throw new Error("🔐 Trūksta šifravimo rakto .env faile");

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
// ⚙️ GAS FEE preset'ai kaip MetaMask: slow, avg, fast
// ==========================================
const GAS_PRESETS = {
  slow:   { priority: "1", max: "20" },
  avg:    { priority: "2", max: "30" },
  fast:   { priority: "4", max: "50" },
};

async function getGasFees(provider, level = "avg") {
  const base = await provider.getFeeData();
  const preset = GAS_PRESETS[level] ?? GAS_PRESETS.avg;

  const maxPriorityFeePerGas = base.maxPriorityFeePerGas ?? ethers.parseUnits(preset.priority, "gwei");
  const maxFeePerGas = base.maxFeePerGas ?? ethers.parseUnits(preset.max, "gwei");

  return { maxPriorityFeePerGas, maxFeePerGas };
}

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

  /**
   * 💸 Apskaičiuoja GAS + Admin fee pagal pasirinktą GAS presetą (slow / avg / fast)
   */
  const calculateFees = useCallback(async (to, amount, gasLevel = "avg") => {
    setFeeError(null);

    if (!chainId) return setFeeError("❌ Tinklas nepasirinktas");
    if (!ethers.isAddress(to)) return setFeeError("❌ Neteisingas adresas");

    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return setFeeError("❌ Netinkama suma");

    setFeeLoading(true);

    try {
      const provider = getProviderForChain(chainId);
      const { maxPriorityFeePerGas, maxFeePerGas } = await getGasFees(provider, gasLevel);

      const weiValue = ethers.parseEther(parsed.toString());
      const weiAdmin = (weiValue * 297n) / 10000n;

      // Estimations: jei nepavyksta – 21000 kaip fallback
      const [gasLimitAdmin, gasLimitMain] = await Promise.all([
        provider.estimateGas({
          to: process.env.NEXT_PUBLIC_ADMIN_WALLET,
          value: weiAdmin,
        }).catch(() => 21000n),
        provider.estimateGas({
          to,
          value: weiValue,
        }).catch(() => 21000n),
      ]);

      const totalGas = maxFeePerGas * (gasLimitAdmin + gasLimitMain);

      // Išsaugom
      setGasFee(Number(ethers.formatEther(totalGas)));
      setAdminFee(Number(ethers.formatEther(weiAdmin)));
      setTotalFee(
        Number(ethers.formatEther(totalGas)) + Number(ethers.formatEther(weiAdmin))
      );
    } catch (err) {
      console.error("⛽ Klaida skaičiuojant fees:", err);
      setFeeError("❌ Fees klaida: " + (err.message || "Nežinoma klaida"));
    } finally {
      setFeeLoading(false);
    }
  }, [chainId]);

  /**
   * ✈️ Vykdom transakciją: pirmiausia admin fee, po to – gavėjui
   */
  const sendTransaction = useCallback(
    async ({ to, amount, userEmail, gasLevel = "avg" }) => {
      const ADMIN = process.env.NEXT_PUBLIC_ADMIN_WALLET;

      if (!ADMIN || !to || !amount || !userEmail || !chainId) {
        throw new Error("❌ Trūksta būtinų duomenų siuntimui");
      }

      setSending(true);

      try {
        // ✅ Patikrinam sesiją + atnaujinam balansus
        await safeRefreshSession();
        await refetch();

        const provider = getProviderForChain(chainId);
        const { maxPriorityFeePerGas, maxFeePerGas } = await getGasFees(provider, gasLevel);

        const parsedAmount = Number(amount);
        const weiValue = ethers.parseEther(parsedAmount.toString());
        const weiAdmin = (weiValue * 297n) / 10000n;

        let signer = activeSigner;

        // 🔐 Jei neturime signerio – dešifruojam private key
        if (!signer) {
          const { data, error } = await supabase
            .from("wallets")
            .select("encrypted_key")
            .eq("user_email", userEmail)
            .single();

          if (error || !data?.encrypted_key) {
            throw new Error("❌ Nerastas užšifruotas raktas");
          }

          const privKey = await decryptKey(data.encrypted_key);
          signer = new ethers.Wallet(privKey, provider);
        }

        // ⛽ Estimuojam GAS
        const [gasLimitAdmin, gasLimitMain] = await Promise.all([
          provider.estimateGas({ to: ADMIN, value: weiAdmin }).catch(() => 21000n),
          provider.estimateGas({ to, value: weiValue }).catch(() => 21000n),
        ]);

        // 💰 Patikrinam ar balanso užtenka
        const balance = await provider.getBalance(walletAddress || signer.address);
        const totalCost = weiValue + weiAdmin + maxFeePerGas * (gasLimitAdmin + gasLimitMain);

        if (balance < totalCost) {
          throw new Error("❌ Nepakanka lėšų siuntimui ir gas mokesčiui");
        }

        // 📤 Siunčiam admin fee
        try {
          await signer.sendTransaction({
            to: ADMIN,
            value: weiAdmin,
            gasLimit: gasLimitAdmin,
            maxPriorityFeePerGas,
            maxFeePerGas,
          });
        } catch (err) {
          console.warn("⚠️ Admin fee nepavyko:", err.message);
        }

        // 📤 Siunčiam gavėjui
        const tx = await signer.sendTransaction({
          to,
          value: weiValue,
          gasLimit: gasLimitMain,
          maxPriorityFeePerGas,
          maxFeePerGas,
        });

        if (!tx.hash) throw new Error("❌ Transakcija nesugeneravo hash");

        // 📦 Įrašom į supabase
        await supabase.from("transactions").insert([{
          user_email: userEmail,
          sender_address: signer.address,
          receiver_address: to,
          amount: parsedAmount,
          fee: Number(ethers.formatEther(weiAdmin)),
          network: activeNetwork,
          type: "send",
          tx_hash: tx.hash,
        }]);

        toast.success("✅ Siuntimas sėkmingas!", { position: "top-center", autoClose: 3000 });
        await refetch();

        return tx.hash;
      } catch (err) {
        console.error("❌ Transakcijos klaida:", err);
        await supabase.from("logs").insert([{
          user_email: userEmail,
          type: "transaction_error",
          message: err.message || "Nežinoma siuntimo klaida",
        }]);
        toast.error("❌ " + (err.message || "Siuntimas nepavyko"), { position: "top-center", autoClose: 5000 });
        throw err;
      } finally {
        setSending(false);
      }
    },
    [activeSigner, walletAddress, activeNetwork, chainId, safeRefreshSession, refetch]
  );

  // ==========================================
  // ✅ Returninam Context Provider su visomis reikšmėmis
  // ==========================================
  return (
    <SendContext.Provider
      value={{
        // Funkcija siųsti
        sendTransaction,

        // Ar vyksta siuntimas
        sending,

        // Funkcija skaičiuoti mokesčius
        calculateFees,

        // Gauti mokesčiai
        gasFee,
        adminFee,
        totalFee,

        // Statusai
        feeLoading,
        feeError,
      }}
    >
      {children}
    </SendContext.Provider>
  );
}
