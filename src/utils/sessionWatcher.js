"use client";

export function startSessionWatcher({ onSessionInvalid, intervalMinutes = 1 }) {
  let intervalId = null;

  const start = () => {
    if (intervalId) return; // ✅ Jau veikia? Niekur neik
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
          console.warn("⚠️ Session API error, server not responding.");
          return; // ✅ Jei tik serverio klaida, nieko nedarom, laukiam kito intervalo
        }

        const data = await res.json();

        if (!data?.valid) {
          console.warn("❌ Session invalid detected (token expired).");
          if (typeof onSessionInvalid === "function") {
            onSessionInvalid();
          }
        }
      } catch (error) {
        console.error("Session watcher network error:", error.message || error);
        // ✅ Jei tik network klaida (pvz. 502, 503), ne logoutinam, o laukiam kito bandymo
      }
    }, intervalMinutes * 60 * 1000); // ✅ Pvz. kas 1 minutę
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return { start, stop };
}
