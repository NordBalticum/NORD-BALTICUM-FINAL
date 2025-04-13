"use client";

import { supabase } from "@/utils/supabaseClient";

// Watcher funkcija
export const startSessionWatcher = ({ onSessionInvalid, intervalMinutes = 2 }) => {
  let intervalId = null;

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("⚠️ Session expired.");
        onSessionInvalid();
      }
    } catch (error) {
      console.error("Session check failed:", error.message);
    }
  };

  const start = () => {
    checkSession(); // Immediate
    intervalId = setInterval(checkSession, intervalMinutes * 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    });
  };

  const stop = () => {
    clearInterval(intervalId);
    document.removeEventListener("visibilitychange", checkSession);
  };

  return { start, stop };
};
