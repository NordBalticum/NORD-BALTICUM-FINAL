"use client";

export async function sendTransaction({ to, amount, network }) {
  if (typeof window === "undefined") {
    console.log("sendTransaction can only be called on the client side.");
    return; // Čia nutraukiam jeigu buildinasi server side
  }

  const { ethers } = await import("ethers"); // importinam viduje funkcijos

  const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || "0xYourAdminWalletAddress";

  if (!to || !amount || !network) throw new Error("Missing parameters.");

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();
    const totalAmount = ethers.parseEther(amount.toString());
    const adminFee = totalAmount * 3n / 100n; // 3%
    const sendAmount = totalAmount - adminFee;

    const feeTx = await signer.sendTransaction({
      to: ADMIN_WALLET,
      value: adminFee,
    });
    await feeTx.wait();

    const tx = await signer.sendTransaction({
      to,
      value: sendAmount,
    });
    await tx.wait();

    console.log("✅ Transaction success:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("❌ sendTransaction failed:", error.message || error);
    throw new Error(error.message || "Transaction failed.");
  }
}
