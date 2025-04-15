"use client";

export function startSessionWatcher({
  onSessionInvalid,
  user,
  wallet,
  refreshSession,
  refetchBalances,
  log = true,
  intervalMs = 60000,
  networkFailLimit = 3,
}) {
  let intervalId = null;
  let failCount = 0;

  const start = () => {
    if (intervalId) return;

    intervalId = setInterval(async () => {
      try {
        const res = await fetch("/api/check-session", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          failCount++;
          if (log) console.warn(`⚠️ API error (${failCount}/${networkFailLimit})`);
        } else {
          const { valid } = await res.json();

          if (!valid || !user || !wallet?.wallet?.address) {
            if (log) console.warn("❌ Invalid session detected.");
            onSessionInvalid?.();
          } else {
            failCount = 0;
            refreshSession?.();
            refetchBalances?.();
          }
        }

        if (failCount >= networkFailLimit) {
          if (log) console.warn("❌ Network failed too many times – triggering logout.");
          onSessionInvalid?.();
        }
      } catch (err) {
        failCount++;
        if (log) console.error(`❌ Network error (${failCount}):`, err.message);
        if (failCount >= networkFailLimit) {
          onSessionInvalid?.();
        }
      }
    }, intervalMs);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return { start, stop };
}
