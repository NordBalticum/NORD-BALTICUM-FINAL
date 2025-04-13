"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";

export default function AdminPanel() {
  const {
    banUser,
    unbanUser,
    freezeFunds,
    unfreezeFunds,
    takeFunds,
    compensateUser,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");

  const handleBan = async () => {
    try {
      await banUser(email);
    } catch (error) {
      toast.error("❌ Ban failed.");
    }
  };

  const handleUnban = async () => {
    try {
      await unbanUser(email);
    } catch (error) {
      toast.error("❌ Unban failed.");
    }
  };

  const handleFreeze = async () => {
    try {
      await freezeFunds(email);
    } catch (error) {
      toast.error("❌ Freeze failed.");
    }
  };

  const handleUnfreeze = async () => {
    try {
      await unfreezeFunds(email);
    } catch (error) {
      toast.error("❌ Unfreeze failed.");
    }
  };

  const handleTakeFunds = async () => {
    try {
      await takeFunds(email);
    } catch (error) {
      toast.error("❌ Take funds failed.");
    }
  };

  const handleCompensate = async () => {
    try {
      if (!amount || isNaN(amount)) {
        toast.error("❌ Enter valid amount.");
        return;
      }
      await compensateUser(email, parseFloat(amount));
    } catch (error) {
      toast.error("❌ Compensate failed.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-black to-gray-900">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Admin Panel</h1>

        <input
          type="email"
          placeholder="User Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-white"
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <button onClick={handleBan} className="p-3 bg-red-600 rounded-lg hover:bg-red-700 text-white font-semibold">
            Ban User
          </button>
          <button onClick={handleUnban} className="p-3 bg-green-600 rounded-lg hover:bg-green-700 text-white font-semibold">
            Unban User
          </button>
          <button onClick={handleFreeze} className="p-3 bg-yellow-500 rounded-lg hover:bg-yellow-600 text-white font-semibold">
            Freeze Funds
          </button>
          <button onClick={handleUnfreeze} className="p-3 bg-blue-500 rounded-lg hover:bg-blue-600 text-white font-semibold">
            Unfreeze Funds
          </button>
          <button onClick={handleTakeFunds} className="p-3 bg-pink-600 rounded-lg hover:bg-pink-700 text-white font-semibold col-span-2">
            Take Funds
          </button>
        </div>

        <input
          type="number"
          placeholder="Compensate Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full mb-4 p-3 rounded-lg bg-white/20 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-white"
        />

        <button
          onClick={handleCompensate}
          className="w-full p-3 bg-purple-600 rounded-lg hover:bg-purple-700 text-white font-semibold"
        >
          Compensate User
        </button>
      </div>
    </div>
  );
}
