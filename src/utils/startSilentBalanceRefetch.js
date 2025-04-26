// src/utils/startSilentBalanceRefetch.js
"use client";

import debounce from "lodash.debounce";

const SESSION_INTERVAL = 30_000;
const HEARTBEAT_INTERVAL = 120_000;
const MAX_RETRIES = 6;

export function startSilentBalanceRefetch(refetch) {
  if (typeof window === "undefined" || typeof refetch !== "function") {
    console.error("[SilentBalanceRefetch] ❌ Invalid usage or missing window/refetch function.");
    return () => {}; // Grąžinam tuščią funkciją saugiai
  }

  let retryQueue = [];
  let retryCount = 0;
  let lastOnlineSpeed = "unknown";
  let isOffline = false;
  let heartbeatTimer = null;
  let intervalTimer = null;

  const resetRetries = () => {
    retryCount = 0;
    retryQueue.forEach(clearTimeout);
    retryQueue = [];
  };

  const getNetworkSpeed = () => {
    return navigator.connection?.effectiveType || "unknown";
  };

  const getDelay = () => {
    const baseDelay = 3000;
    const exponential = Math.min(2 ** retryCount * baseDelay, 60000); // max 60s
    if (lastOnlineSpeed.includes("2g") || lastOnlineSpeed.includes("slow")) {
      return exponential * 1.5;
    }
    return exponential;
  };

  const scheduleRetry = () => {
    if (retryCount >= MAX_RETRIES) {
      console.error("[SilentBalanceRefetch] ❌ Max retries reached. No more retries.");
      return;
    }

    const delay = getDelay();
    console.warn(`[SilentBalanceRefetch] 🔁 Retrying in ${Math.round(delay / 1000)}s...`);

    const id = setTimeout(() => {
      if (!isOffline) safeRefetch("retry");
    }, delay);

    retryQueue.push(id);
    retryCount++;
  };

  const safeRefetch = async (source) => {
    if (isOffline) {
      console.warn(`[SilentBalanceRefetch] Skipped fetch (offline) [${source}]`);
      return;
    }

    try {
      await refetch();
      console.log(`[SilentBalanceRefetch] ✅ Successfully refetched via ${source}`);
      resetRetries();
    } catch (err) {
      console.error(`[SilentBalanceRefetch] ❌ Refetch failed via ${source}:`, err?.message || err);
      scheduleRetry();
    }
  };

  const onVisibilityChange = debounce(() => {
    if (document.visibilityState === "visible") safeRefetch("visibility");
  }, 300);

  const onFocus = debounce(() => safeRefetch("focus"), 300);

  const onOnline = debounce(() => {
    console.log("[SilentBalanceRefetch] 📶 Back online detected");
    isOffline = false;
    lastOnlineSpeed = getNetworkSpeed();
    safeRefetch("online");
  }, 300);

  const onOffline = debounce(() => {
    console.warn("[SilentBalanceRefetch] 🔌 Offline detected");
    isOffline = true;
  }, 300);

  const onWakeLock = debounce(() => {
    if (document.visibilityState === "visible") safeRefetch("wake-up");
  }, 300);

  // Heartbeat: kas 2min
  heartbeatTimer = setInterval(() => {
    if (!isOffline) {
      console.log("[SilentBalanceRefetch] 💓 Heartbeat refetch");
      safeRefetch("heartbeat");
    }
  }, HEARTBEAT_INTERVAL);

  // Interval: kas 30s
  intervalTimer = setInterval(() => {
    if (!isOffline) {
      lastOnlineSpeed = getNetworkSpeed();
      safeRefetch("interval");
    }
  }, SESSION_INTERVAL);

  // Event listeners
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("focus", onFocus);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  document.addEventListener("resume", onWakeLock);

  // RETURN clean stop function
  return () => {
    retryQueue.forEach(clearTimeout);
    retryQueue = [];
    clearInterval(heartbeatTimer);
    clearInterval(intervalTimer);

    onVisibilityChange.cancel();
    onFocus.cancel();
    onOnline.cancel();
    onOffline.cancel();
    onWakeLock.cancel();

    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    document.removeEventListener("resume", onWakeLock);

    console.log("[SilentBalanceRefetch] 🛑 Silent balance refetch stopped.");
  };
}
