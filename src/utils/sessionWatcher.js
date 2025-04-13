// src/utils/sessionWatcher.js
"use client";

export function startSessionWatcher({ onSessionInvalid, intervalMinutes = 1 }) {
  let intervalId = null;

  const start = () => {
    if (intervalId) return; // ✅ jei jau veikia, nieko nedaryti
    intervalId = setInterval(async () => {
      try {
        const res = await fetch("/api/check-session", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Session check failed");
        }

        const data = await res.json();

        if (!data?.valid) {
          console.warn("❌ Session invalid detected.");
          if (typeof onSessionInvalid === "function") {
            onSessionInvalid();
          }
        }
      } catch (error) {
        console.error("Session watcher error:", error.message || error);
        if (typeof onSessionInvalid === "function") {
          onSessionInvalid();
        }
      }
    }, intervalMinutes * 60 * 1000); // ✅ pvz. kas 1 minutę
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return { start, stop };
}
