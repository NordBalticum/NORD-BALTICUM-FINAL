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
  let lastVisibility = document.visibilityState;

  const logEvent = (msg, type = "log") => {
    if (!log) return;
    console[type](`[SessionWatcher] ${msg}`);
  };

  const checkSession = async (trigger = "interval") => {
    try {
      const res = await fetch("/api/check-session", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        failCount++;
        logEvent(`API error (${failCount}/${networkFailLimit})`, "warn");
      } else {
        const { valid } = await res.json();

        if (!valid || !user || !wallet?.wallet?.address) {
          logEvent("Invalid session detected.", "warn");
          onSessionInvalid?.();
        } else {
          failCount = 0;
          refreshSession?.();
          refetchBalances?.();
          logEvent(`Session OK [${trigger}]`);
        }
      }

      if (failCount >= networkFailLimit) {
        logEvent("Network failed too many times – triggering logout.", "error");
        onSessionInvalid?.();
      }
    } catch (err) {
      failCount++;
      logEvent(`Network error (${failCount}): ${err.message}`, "error");
      if (failCount >= networkFailLimit) {
        onSessionInvalid?.();
      }
    }
  };

  const visibilityHandler = () => {
    const current = document.visibilityState;
    if (current === "visible" && lastVisibility !== "visible") {
      logEvent("Tab became visible – immediate session check.");
      checkSession("visibility");
    }
    lastVisibility = current;
  };

  const onlineHandler = () => {
    logEvent("Network reconnected – immediate session check.");
    checkSession("network-online");
  };

  const wakeHandler = () => {
    logEvent("Device woke up – immediate session check.");
    checkSession("wake-up");
  };

  const addEvents = () => {
    document.addEventListener("visibilitychange", visibilityHandler);
    window.addEventListener("online", onlineHandler);
    document.addEventListener("resume", wakeHandler); // Android wake
    document.addEventListener("pageshow", wakeHandler); // iOS wake
  };

  const removeEvents = () => {
    document.removeEventListener("visibilitychange", visibilityHandler);
    window.removeEventListener("online", onlineHandler);
    document.removeEventListener("resume", wakeHandler);
    document.removeEventListener("pageshow", wakeHandler);
  };

  const start = () => {
    if (intervalId) return;
    addEvents();
    intervalId = setInterval(() => checkSession("interval"), intervalMs);
    logEvent("SessionWatcher started.");
  };

  const stop = () => {
    clearInterval(intervalId);
    intervalId = null;
    removeEvents();
    logEvent("SessionWatcher stopped.");
  };

  return { start, stop };
}
