"use client";

import debounce from "lodash.debounce";
import { detectIsMobile } from "@/utils/detectIsMobile";

/**
 * startSessionWatcher:
 * Monitors user session validity via periodic API pings and browser events.
 * On repeated failures or invalid response, triggers onSessionInvalid callback.
 *
 * @param {Object} options
 * @param {Object} options.user            Supabase user object
 * @param {Object} options.wallet          Decrypted wallet info ({ wallet, signers })
 * @param {Function} options.refreshSession  safeRefreshSession from AuthContext
 * @param {Function} options.refetchBalances refetch from BalanceContext
 * @param {Function} options.onSessionInvalid called when session should be invalidated
 * @param {boolean} [options.log=true]     enable console logs
 * @param {number}  [options.intervalMs=60000] periodic check interval (ms)
 * @param {number}  [options.networkFailLimit=3] consecutive failure limit
 *
 * @returns {{ start: Function, stop: Function }}
 */
export function startSessionWatcher({
  user,
  wallet,
  refreshSession,
  refetchBalances,
  onSessionInvalid,
  log = true,
  intervalMs = 60000,
  networkFailLimit = 3,
}) {
  // SSR guard
  if (typeof window === "undefined") {
    return { start: () => {}, stop: () => {} };
  }

  let intervalId = null;
  let failCount = 0;
  let lastOkTime = Date.now();
  let lastVisibility = document.visibilityState;

  const isMobile = detectIsMobile();

  const logEvent = (msg, level = "log") => {
    if (!log) return;
    // eslint-disable-next-line no-console
    console[level]?.(`[SessionWatcher] ${msg}`);
  };

  const isReady = () => !!user?.email && !!wallet?.wallet?.address;

  // Actual session check
  const performCheck = async (trigger = "manual", attempt = 1) => {
    if (!isReady()) {
      logEvent(`Skipped [${trigger}] – session not ready.`, "warn");
      return;
    }

    // fresh AbortController per request
    const controller = new AbortController();
    try {
      const startTime = performance.now();
      const res = await fetch("/api/check-session", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const { valid } = await res.json();
      if (!valid) {
        if (attempt < 3) {
          logEvent(`Invalid session (attempt ${attempt}) – retrying...`, "warn");
          return setTimeout(() => performCheck(trigger, attempt + 1), 700);
        }
        logEvent("Session invalid according to API", "warn");
        onSessionInvalid?.();
      } else {
        // success
        failCount = 0;
        lastOkTime = Date.now();
        const latency = Math.round(performance.now() - startTime);
        logEvent(`✅ Session OK [${trigger}] (${latency}ms)`);
        refreshSession?.().catch(() => {});
        refetchBalances?.().catch(() => {});
      }
    } catch (err) {
      if (err.name === "AbortError") {
        logEvent("Fetch aborted", "warn");
      } else {
        failCount++;
        logEvent(`Error [${trigger}]: ${err.message} (${failCount}/${networkFailLimit})`, "error");
        if (failCount >= networkFailLimit) {
          logEvent("Fail limit reached – invalidating session", "error");
          onSessionInvalid?.();
        }
      }
    }
  };

  const debouncedCheck = debounce((trigger) => performCheck(trigger), 300);

  // Event handlers
  const onVisibilityChange = () => {
    const current = document.visibilityState;
    if (current === "visible" && lastVisibility !== "visible") {
      logEvent("Tab visible – checking session");
      debouncedCheck("visibility");
    }
    lastVisibility = current;
  };

  const onFocus = () => {
    logEvent("Window focus – checking session");
    debouncedCheck("focus");
  };

  const onOnline = () => {
    logEvent("Network online – checking session");
    debouncedCheck("online");
  };

  const onWake = () => {
    logEvent("Pageshow/device resume – checking session");
    debouncedCheck("pageshow");
  };

  const addListeners = () => {
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    window.addEventListener("pageshow", onWake);
    document.addEventListener("resume", onWake);
    if (isMobile) {
      logEvent("📱 Mobile enhancements enabled");
    }
  };

  const removeListeners = () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("pageshow", onWake);
    document.removeEventListener("resume", onWake);
  };

  const start = () => {
    if (intervalId) return;
    addListeners();
    intervalId = setInterval(() => {
      // Reset fail count after long healthy period
      if (Date.now() - lastOkTime > 10 * 60 * 1000) {
        failCount = 0;
      }
      performCheck("interval");
    }, intervalMs);
    logEvent("SessionWatcher started");
  };

  const stop = () => {
    clearInterval(intervalId);
    intervalId = null;
    removeListeners();
    debouncedCheck.cancel();
    logEvent("SessionWatcher stopped");
  };

  return { start, stop };
                                 }
