// sessionWatcher.js

"use client";

import { useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { useSystemReady } from "@/hooks/useSystemReady";

const SESSION_REFRESH_INTERVAL = 30_000; // kas 30s
const MAX_FAILURES = 3; // kiek klaidų leidžiam prieš logout
const DEBOUNCE_DELAY = 300; // ms debounce viskam

export function useSessionWatcher() {
  const { ready } = useSystemReady();
  const { signOut, safeRefreshSession } = useAuth();
  const { refetch } = useBalance();

  const failureCount = useRef(0);
  const lastRefresh = useRef(Date.now());
  const timers = useRef([]);

  useEffect(() => {
    if (!ready) return;

    const safeRun = async (source) => {
      try {
        await safeRefreshSession();
        await refetch();
        failureCount.current = 0;
        lastRefresh.current = Date.now();
        console.log(`[SessionWatcher] ✅ Refreshed by ${source}`);
      } catch (err) {
        failureCount.current++;
        console.error(`[SessionWatcher] ❌ Refresh failed (${source}):`, err?.message || err);
        if (failureCount.current >= MAX_FAILURES) {
          console.error("[SessionWatcher] ❌ Too many failures. Signing out...");
          toast.error("⚠️ Session expired. Logging out...");
          signOut(true);
        }
      }
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

    const interval = setInterval(() => {
      if (Date.now() - lastRefresh.current > SESSION_REFRESH_INTERVAL) {
        safeRun("interval");
      }
    }, SESSION_REFRESH_INTERVAL);

    timers.current.push(interval);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    timers.current.push(onVisibilityChange);
    timers.current.push(onFocus);
    timers.current.push(onOnline);

    return () => {
      clearInterval(interval);
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
