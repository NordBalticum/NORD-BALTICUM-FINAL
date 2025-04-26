"use client";

import { useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";

const BASE_REFRESH_INTERVAL = 30_000; // 30s
const MAX_FAILURES = 3;                // Max klaidos prieš logout
const DEBOUNCE_DELAY = 300;             // Debounce events
const MAX_BACKOFF = 300_000;            // Max 5 min timeout

export function useSessionWatcher() {
  const { ready } = useSystemReady();
  const { signOut, safeRefreshSession } = useAuth();
  const { refetch } = useBalance();

  const failureCount = useRef(0);
  const backoffMultiplier = useRef(1);
  const lastRefresh = useRef(Date.now());
  const timers = useRef([]);

  useEffect(() => {
    if (!ready) return;

    const resetBackoff = () => {
      backoffMultiplier.current = 1;
    };

    const increaseBackoff = () => {
      backoffMultiplier.current = Math.min(backoffMultiplier.current * 2, MAX_BACKOFF / BASE_REFRESH_INTERVAL);
    };

    const safeRun = async (source) => {
      try {
        await safeRefreshSession();
        await refetch();
        failureCount.current = 0;
        lastRefresh.current = Date.now();
        resetBackoff();
        console.log(`[SessionWatcher] ✅ Session refreshed by ${source}`);
      } catch (err) {
        failureCount.current++;
        console.error(`[SessionWatcher] ❌ Refresh failed (${source}):`, err?.message || err);
        if (failureCount.current >= MAX_FAILURES) {
          console.error("[SessionWatcher] ❌ Too many failures. Signing out...");
          toast.error("⚠️ Session expired. Logging out...");
          signOut(true);
        } else {
          increaseBackoff();
          console.warn(`[SessionWatcher] 🔁 Retrying in ${BASE_REFRESH_INTERVAL * backoffMultiplier.current / 1000}s...`);
          clearInterval(intervalId.current);
          setupInterval(); // restartinam su didesniu timeoutu
        }
      }
    };

    const intervalId = useRef(null);

    const setupInterval = () => {
      clearInterval(intervalId.current);
      intervalId.current = setInterval(() => {
        if (Date.now() - lastRefresh.current > BASE_REFRESH_INTERVAL * backoffMultiplier.current) {
          safeRun("interval");
        }
      }, BASE_REFRESH_INTERVAL * backoffMultiplier.current);
      timers.current.push(intervalId.current);
    };

    const onVisibilityChange = debounce(() => {
      if (document.visibilityState === "visible") {
        safeRun("visibility");
      }
    }, DEBOUNCE_DELAY);

    const onFocus = debounce(() => {
      safeRun("focus");
    }, DEBOUNCE_DELAY);

    const onOnline = debounce(() => {
      safeRun("online");
    }, DEBOUNCE_DELAY);

    setupInterval();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    timers.current.push(onVisibilityChange);
    timers.current.push(onFocus);
    timers.current.push(onOnline);

    return () => {
      clearInterval(intervalId.current);
      timers.current.forEach(clearTimeout);
      timers.current = [];
      onVisibilityChange.cancel();
      onFocus.cancel();
      onOnline.cancel();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [ready, safeRefreshSession, refetch, signOut]);
}
