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

  const isReady = () => {
    return !!user?.email && !!wallet?.wallet?.address;
  };

  const checkSession = async (trigger = "interval") => {
    if (!isReady()) {
      logEvent(`Skipped check [${trigger}] – session not ready.`, "warn");
      return;
    }

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

        if (!valid) {
          logEvent("Invalid session from API. Triggering logout.", "warn");
          onSessionInvalid?.();
        } else {
          failCount = 0;
          refreshSession?.();
          refetchBalances?.();
          logEvent(`✅ Session OK [${trigger}]`);
        }
      }

      if (failCount >= networkFailLimit) {
        logEvent("❌ Too many failed checks – logout triggered.", "error");
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
      logEvent("Tab became visible – checking session...");
      checkSession("visibility");
    }
    lastVisibility = current;
  };

  const onlineHandler = () => {
    logEvent("Network online – checking session...");
    checkSession("network-online");
  };

  const wakeHandler = () => {
    logEvent("Device wake-up – checking session...");
    checkSession("wake-up");
  };

  const addEvents = () => {
    document.addEventListener("visibilitychange", visibilityHandler);
    window.addEventListener("online", onlineHandler);
    document.addEventListener("resume", wakeHandler);
    document.addEventListener("pageshow", wakeHandler);
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
    logEvent("✅ SessionWatcher started.");
  };

  const stop = () => {
    clearInterval(intervalId);
    intervalId = null;
    removeEvents();
    logEvent("🛑 SessionWatcher stopped.");
  };

  return { start, stop };
}
