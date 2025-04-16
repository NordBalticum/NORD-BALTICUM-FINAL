"use client";

import debounce from "lodash.debounce";
import { detectIsMobile } from "@/utils/detectIsMobile";

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
  let lastOkTime = Date.now();

  const isClient = typeof window !== "undefined";
  const isMobile = detectIsMobile();
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;

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
      onSessionInvalid?.(); // Fallback
      return;
    }

    try {
      const start = performance.now();
      const res = await fetch("/api/check-session", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: controller?.signal,
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
          lastOkTime = Date.now();
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
      if (err?.name === "AbortError") {
        logEvent("Request aborted", "warn");
        return;
      }

      failCount++;
      logEvent(`Network error (${failCount}): ${err?.message || err}`, "error");

      if (failCount >= networkFailLimit) {
        onSessionInvalid?.();
      }
    }
  };

  const debouncedCheck = debounce((trigger) => checkSession(trigger), 250);

  const visibilityHandler = () => {
    const current = document.visibilityState;
    if (current === "visible" && lastVisibility !== "visible") {
      logEvent("Tab became visible – checking session...");
      debouncedCheck("visibility");
    }
    lastVisibility = current;
  };

  const focusHandler = () => {
    logEvent("Window focus – checking session...");
    debouncedCheck("focus");
  };

  const onlineHandler = () => {
    logEvent("Network online – checking session...");
    debouncedCheck("network-online");
  };

  const wakeHandler = () => {
    logEvent("Device wake-up – checking session...");
    debouncedCheck("wake-up");
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
    intervalId = setInterval(() => {
      // Reset fail count if last successful session was a while ago
      if (Date.now() - lastOkTime > 10 * 60 * 1000) {
        failCount = 0;
      }
      checkSession("interval");
    }, intervalMs);
    logEvent("✅ SessionWatcher started.");
  };

  const stop = () => {
    clearInterval(intervalId);
    intervalId = null;
    removeEvents();
    controller?.abort?.();
    logEvent("🛑 SessionWatcher stopped.");
  };

  return { start, stop };
}
