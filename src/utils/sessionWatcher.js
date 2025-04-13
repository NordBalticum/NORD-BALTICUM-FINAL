"use client";

import { supabase } from "@/utils/supabaseClient";

// 1️⃣ Start Session Watcher
export const startSessionWatcher = ({ onSessionInvalid, intervalMinutes = 1 }) => {
  let intervalId = null;

  // 2️⃣ Tikrinam sesiją
  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("⚠️ Session expired.");
        if (typeof onSessionInvalid === "function") {
          onSessionInvalid();
        }
      }
    } catch (error) {
      console.error("Session check failed:", error.message);
    }
  };

  // 3️⃣ Start funkcija
  const start = () => {
    checkSession(); // Iškart tikrinam
    intervalId = setInterval(checkSession, intervalMinutes * 60 * 1000); // kas n minučių
    document.addEventListener("visibilitychange", handleVisibilityChange);
  };

  // 4️⃣ Stop funkcija
  const stop = () => {
    clearInterval(intervalId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };

  // 5️⃣ Kai grįžtam į puslapį — iškart tikrinam
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      checkSession();
    }
  };

  return { start, stop };
};
