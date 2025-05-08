"use client";

// ==================================================
// 🔄 SilentBalanceRefetch – FINAL META-GRADE VERSION
// ✅ Auto refetch | Retry logic | Debounce | SSR-safe
// ✅ Network speed detection | Offline/online guards
// ✅ Visibility + Focus triggers | Heartbeat + Interval
// ==================================================

import debounce from "lodash.debounce";

// Konfigūracija (sekundėmis)
const INTERVAL_MS = 30_000;      // Normalus refetch ciklas (30s)
const HEARTBEAT_MS = 120_000;    // Širdies dūžis – silent check (2min)
const MAX_RETRIES = 6;

// ==========================================
// 🔁 Paleidžia silent refetch su retry logika
// ==========================================
export function startSilentBalanceRefetch(refetch) {
  if (typeof window === "undefined" || typeof refetch !== "function") {
    console.error("❌ [SilentBalanceRefetch] Netinkamas kvietimas (SSR ar refetch nėra funkcija)");
    return () => {}; // tuščias saugus stop
  }

  let retryCount = 0;
  let retryTimers = [];
  let lastSpeed = "unknown";
  let isOffline = false;
  let isRefetching = false;

  let heartbeatTimer = null;
  let intervalTimer = null;

  // ================================
  // ⛔ Atnaujinti retry sistemą
  // ================================
  const resetRetries = () => {
    retryCount = 0;
    retryTimers.forEach(clearTimeout);
    retryTimers = [];
  };

  const getNetworkSpeed = () =>
    navigator.connection?.effectiveType || "unknown";

  const getRetryDelay = () => {
    const base = 3000;
    const expo = Math.min(2 ** retryCount * base, 60_000);
    return lastSpeed.includes("2g") || lastSpeed.includes("slow") ? expo * 1.5 : expo;
  };

  const scheduleRetry = () => {
    if (retryCount >= MAX_RETRIES) {
      console.warn("❌ [SilentBalanceRefetch] Pasiektas maksimalus bandymų kiekis");
      return;
    }

    const delay = getRetryDelay();
    console.warn(`🔁 [SilentBalanceRefetch] Bandymas #${retryCount + 1} po ${Math.round(delay / 1000)}s...`);

    const id = setTimeout(() => {
      if (!isOffline) performRefetch("retry");
    }, delay);

    retryTimers.push(id);
    retryCount++;
  };

  // ================================
  // ✅ Saugus refetch
  // ================================
  const performRefetch = async (source = "unknown") => {
    if (isOffline) {
      console.log(`[SilentBalanceRefetch] ⏸️ Skip: Offline režimas [${source}]`);
      return;
    }
    if (isRefetching) return;

    isRefetching = true;
    try {
      await refetch();
      console.log(`[SilentBalanceRefetch] ✅ Refetched iš: ${source}`);
      resetRetries();
    } catch (err) {
      console.error(`❌ [SilentBalanceRefetch] Klaida (${source}):`, err?.message || err);
      scheduleRetry();
    } finally {
      isRefetching = false;
    }
  };

  // ================================
  // 🧠 Event listeneriai
  // ================================
  const onFocus = debounce(() => performRefetch("focus"), 300);
  const onVisibility = debounce(() => {
    if (document.visibilityState === "visible") performRefetch("visibility");
  }, 300);
  const onOnline = debounce(() => {
    isOffline = false;
    lastSpeed = getNetworkSpeed();
    console.log("[SilentBalanceRefetch] 📶 Online grįžo, paleidžiam refetch");
    performRefetch("online");
  }, 300);
  const onOffline = debounce(() => {
    isOffline = true;
    console.warn("[SilentBalanceRefetch] 🔌 Atskirtas nuo interneto");
  }, 300);
  const onWake = debounce(() => {
    if (document.visibilityState === "visible") performRefetch("wake");
  }, 300);

  // ================================
  // ⏱️ Heartbeat + Intervalai
  // ================================
  heartbeatTimer = setInterval(() => {
    if (!isOffline) performRefetch("heartbeat");
  }, HEARTBEAT_MS);

  intervalTimer = setInterval(() => {
    if (!isOffline) {
      lastSpeed = getNetworkSpeed();
      performRefetch("interval");
    }
  }, INTERVAL_MS);

  // ================================
  // 📡 Įvykiai
  // ================================
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("focus", onFocus);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  document.addEventListener("resume", onWake);

  // ================================
  // 🛑 Stop funkcija
  // ================================
  return () => {
    retryTimers.forEach(clearTimeout);
    retryTimers = [];
    clearInterval(intervalTimer);
    clearInterval(heartbeatTimer);

    onFocus.cancel();
    onVisibility.cancel();
    onOnline.cancel();
    onOffline.cancel();
    onWake.cancel();

    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    document.removeEventListener("resume", onWake);

    console.log("[SilentBalanceRefetch] 🛑 Sustabdytas silent refetch.");
  };
}
