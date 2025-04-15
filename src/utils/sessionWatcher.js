// src/utils/sessionWatcher.js
// === ULTIMATE SESSION WATCHER v2025 FINAL MOBILE-TOUCH READY EDITION ===

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
  let lastLatency = 0;

  const isClient = typeof window !== "undefined";

  const isMobile = (() => {
    if (!isClient) return false;

    const ua = navigator.userAgent.toLowerCase();
    const isTouch =
      navigator.maxTouchPoints > 1 ||
      "ontouchstart" in window ||
      window.matchMedia("(pointer: coarse)").matches;

    const isMobileUA = /android|iphone|ipod|iemobile|blackberry|bada|webos|opera mini|mobile|palm|windows phone|nexus|pixel|sm-|samsung/.test(ua);
    const isTabletUA = /ipad|tablet/.test(ua);
    const isDesktopUA = /macintosh|windows nt|linux x86_64/.test(ua);

    return isTouch && (isMobileUA || (!isDesktopUA && !isTabletUA));
  })();

  const logEvent = (msg, type = "log") => {
    if (!log || !console[type]) return;
    console[type](`[SessionWatcher] ${msg}`);
  };

  const isReady = () => {
    return !!user?.email && !!wallet?.wallet?.address;
  };

  const checkSession = async (trigger = "interval", attempt = 1) => {
    if (!isReady()) {
      logEvent(`Skipped check [${trigger}] – session not ready.`, "warn");
      return;
    }

    try {
      const start = performance.now();

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
          if (attempt < 3) {
            logEvent(`Attempt ${attempt} failed – retrying...`);
            return setTimeout(() => checkSession(trigger, attempt + 1), 700);
          }
          logEvent("Invalid session from API. Triggering logout.", "warn");
          onSessionInvalid?.();
        } else {
          failCount = 0;
          refreshSession?.();
          refetchBalances?.();
          lastLatency = Math.round(performance.now() - start);
          logEvent(`✅ Session OK [${trigger}] (${lastLatency}ms)`);
        }
      }

      if (failCount >= networkFailLimit) {
        logEvent("❌ Too many failed checks – logout triggered.", "error");
        onSessionInvalid?.();
      }
    } catch (err) {
      failCount++;
      logEvent(`Network error (${failCount}): ${err?.message || err}`, "error");
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

  const focusHandler = () => {
    logEvent("Window focus – checking session...");
    checkSession("focus");
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
    window.addEventListener("focus", focusHandler);
    window.addEventListener("online", onlineHandler);
    document.addEventListener("resume", wakeHandler);
    window.addEventListener("pageshow", wakeHandler);

    if (isMobile) {
      logEvent("📱 Mobile device detected – enhanced session tracking enabled.");
    }
  };

  const removeEvents = () => {
    document.removeEventListener("visibilitychange", visibilityHandler);
    window.removeEventListener("focus", focusHandler);
    window.removeEventListener("online", onlineHandler);
    document.removeEventListener("resume", wakeHandler);
    window.removeEventListener("pageshow", wakeHandler);
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
