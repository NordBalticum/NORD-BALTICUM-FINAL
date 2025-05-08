"use client";

import { useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";

const BASE_REFRESH_INTERVAL = 30_000; // 30s
const MAX_FAILURES = 3;
const MAX_BACKOFF = 5 * 60 * 1000; // 5min
const DEBOUNCE_DELAY = 300;

export function useSessionWatcher() {
  const { ready } = useSystemReady();
  const { signOut, safeRefreshSession } = useAuth();
  const { refetch } = useBalance();

  const failureCount = useRef(0);
  const backoffMultiplier = useRef(1);
  const lastRefresh = useRef(Date.now());
  const intervalId = useRef(null);
  const destroyed = useRef(false);

  useEffect(() => {
    if (!ready) return;

    destroyed.current = false;

    const resetBackoff = () => {
      backoffMultiplier.current = 1;
    };

    const increaseBackoff = () => {
      const next = backoffMultiplier.current * 2;
      backoffMultiplier.current = Math.min(next, MAX_BACKOFF / BASE_REFRESH_INTERVAL);
    };

    const handleFailure = async (err, source) => {
      failureCount.current++;
      console.warn(`[SessionWatcher] ⚠️ Failure ${failureCount.current}/${MAX_FAILURES} on ${source}:`, err?.message || err);

      if (failureCount.current >= MAX_FAILURES) {
        console.error("[SessionWatcher] ❌ Too many consecutive session failures. Triggering safe logout.");
        toast.error("Session expired. You were logged out for security reasons.");
        await signOut(true);
      } else {
        increaseBackoff();
        setupInterval(); // Restart interval with backoff
      }
    };

    const safeRun = async (source) => {
      if (destroyed.current) return;

      try {
        console.log(`[SessionWatcher] ⏳ Running session refresh (${source})...`);
        await safeRefreshSession();
        await refetch();
        failureCount.current = 0;
        lastRefresh.current = Date.now();
        resetBackoff();
        console.log(`[SessionWatcher] ✅ Session refreshed (${source})`);
      } catch (err) {
        await handleFailure(err, source);
      }
    };

    const setupInterval = () => {
      if (intervalId.current) clearInterval(intervalId.current);
      const delay = BASE_REFRESH_INTERVAL * backoffMultiplier.current;

      intervalId.current = setInterval(() => {
        const elapsed = Date.now() - lastRefresh.current;
        if (elapsed >= delay) {
          safeRun("interval");
        }
      }, delay);
    };

    const debouncedVisibility = debounce(() => {
      if (document.visibilityState === "visible") {
        safeRun("visibility");
      }
    }, DEBOUNCE_DELAY);

    const debouncedFocus = debounce(() => {
      safeRun("focus");
    }, DEBOUNCE_DELAY);

    const debouncedOnline = debounce(() => {
      safeRun("online");
    }, DEBOUNCE_DELAY);

    setupInterval();
    document.addEventListener("visibilitychange", debouncedVisibility);
    window.addEventListener("focus", debouncedFocus);
    window.addEventListener("online", debouncedOnline);

    window.addEventListener("unhandledrejection", globalErrorGuard);
    window.addEventListener("error", globalErrorGuard);

    return () => {
      destroyed.current = true;
      if (intervalId.current) clearInterval(intervalId.current);

      debouncedVisibility.cancel();
      debouncedFocus.cancel();
      debouncedOnline.cancel();

      document.removeEventListener("visibilitychange", debouncedVisibility);
      window.removeEventListener("focus", debouncedFocus);
      window.removeEventListener("online", debouncedOnline);

      window.removeEventListener("unhandledrejection", globalErrorGuard);
      window.removeEventListener("error", globalErrorGuard);
    };
  }, [ready, safeRefreshSession, refetch, signOut]);
}

function globalErrorGuard(event) {
  const msg = event?.reason?.message || event?.message || "Unknown error";
  const isSessionRelated = /session|token|auth|unauthorized/i.test(msg);
  if (isSessionRelated) {
    console.warn("[SessionWatcher] ⛔ Global error triggered session alert:", msg);
    toast.warn("Security issue detected. Please log in again.");
    // Sign out will be triggered via internal logic if needed.
  }
}
